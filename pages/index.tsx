import { useEffect, useMemo, useRef, useState } from "react";
import { buildSchemaFromIntrospection } from "@/lib/graphql/schema";
import {
  buildOperation,
  makeVarDef,
  printDoc,
  Selection,
  rootQueryType,
  collectVariablesFromSelections,
  toNamedTypeNode,
  mergeRootArgsIntoSelections,
} from "@/lib/graphql/ast";
import { DEFAULT_WEIGHTS, scoreField } from "@/lib/graphql/complexity";
import type { GraphQLSchema, GraphQLField } from "graphql";
import { getNamedType } from "graphql";
import { z } from "zod";

import { ConnectPanel } from "@/components/panels/ConnectPanel";
import { RootFieldList } from "@/components/panels/RootFieldList";
import { SelectionPanel } from "@/components/tree/Tree";
import { ComplexityBar } from "@/components/panels/ComplexityBar";
import { QueryPanel } from "@/components/panels/QueryPanel";
import {
  SearchBuilder,
  type SearchCondition,
} from "@/components/search/SearchBuilder";

const ConnectSchema = z.object({
  endpoint: z.string().url(),
  token: z.string().optional(),
});

// Gather values the user typed into field-argument inputs in the selection tree
function collectValuesFromSelections(
  selections: Selection[],
  acc: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const sel of selections) {
    if (sel.args && sel.args.length) {
      for (const a of sel.args) {
        if (a.value !== undefined && a.value !== null && a.value !== "") {
          acc[a.name] = a.value as any;
        }
      }
    }
    if (sel.children && sel.children.length) {
      collectValuesFromSelections(sel.children, acc);
    }
  }
  return acc;
}

export default function Home() {
  const [endpoint, setEndpoint] = useState<string>(
    process.env.NEXT_PUBLIC_XM_ENDPOINT || ""
  );

  const [resetTick, setResetTick] = useState(0);

  // search-specific UI state (if not already present)
  const [searchGroup, setSearchGroup] = useState<"AND" | "OR">("AND");
  const [searchConds, setSearchConds] = useState<any[]>([]);

  const [token, setToken] = useState<string>("");
  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [rootFieldName, setRootFieldName] = useState<string | null>(null);
  const [rootArgs, setRootArgs] = useState<Record<string, unknown>>({});
  const [selection, setSelection] = useState<Selection[]>([]);

  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [variableDefs, setVariableDefs] = useState<
    import("graphql").VariableDefinitionNode[]
  >([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // pagination states for search root
  const [pageSize, setPageSize] = useState<number>(10);
  const [after, setAfter] = useState<string>("");

  useEffect(() => {
    if (!rootFieldName) return;

    // Clear query-building state
    setSelection([]);
    setRootArgs({});
    setVariableDefs([]);
    setResult(null);

    // Reset search UI state too
    setSearchGroup("AND");
    setSearchConds([]);
    setPageSize(10);
    setAfter("");

    // bump tick so components like SearchBuilder remount (resetting their internal state)
    setResetTick((t) => t + 1);
  }, [rootFieldName]);

  async function connect() {
    setConnectError(null);
    const parsed = ConnectSchema.safeParse({
      endpoint,
      token: token || undefined,
    });
    if (!parsed.success) {
      setConnectError(parsed.error.errors[0]?.message);
      return;
    }
    const r = await fetch("/api/schema", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "Content-Type": "application/json" },
    });
    const json = await r.json();
    if (!r.ok || json.error) {
      setConnectError(json.error || "Failed to introspect.");
      return;
    }
    const sch = buildSchemaFromIntrospection(json);
    setSchema(sch);
  }

  const { queryText, complexity, warnLevel } = useMemo(() => {
    console.log("Query generation triggered with:", {
      schema: !!schema,
      rootFieldName,
      rootArgs,
      selection,
    });
    if (!schema || !rootFieldName) {
      setVariableDefs([]);
      return { queryText: "", complexity: 0, warnLevel: "ok" as const };
    }
    const qField = rootQueryType(schema).getFields()[rootFieldName];

    // 1) Merge the current root args + tree selection under the chosen root field
    const mergedSelectionsBase = mergeRootArgsIntoSelections(
      rootFieldName,
      rootArgs,
      selection,
      qField?.args
    );

    // 2) For the search root, inline where/orderBy; keep pagination as variables
    let mergedSelections = mergedSelectionsBase;

    if (rootFieldName === "search" && mergedSelectionsBase.length === 1) {
      const only = mergedSelectionsBase[0];

      const literalArgs = (only.args ?? []).map((a) => {
        // Inline these:
        if (a.name === "where" || a.name === "orderBy") {
          return { ...a, literal: true };
        }
        // Keep variables for pagination, but allow nice variable names
        if (a.name === "first") {
          return { ...a, varName: "pageSize" }; // produces $pageSize
        }
        if (a.name === "after") {
          return { ...a, varName: "after" }; // produces $after
        }
        return a;
      });

      // Ensure default selection if empty
      const hasChildren = (only.children ?? []).length > 0;
      const defaultChildren = [
        { field: "total" },
        {
          field: "pageInfo",
          children: [{ field: "endCursor" }, { field: "hasNext" }],
        },
        {
          field: "results",
          children: [{ field: "url", children: [{ field: "path" }] }],
        },
      ];

      mergedSelections = [
        {
          ...only,
          args: literalArgs,
          children: hasChildren ? only.children : defaultChildren,
        },
      ];
    }

    // 3) Infer variables only from non-literal args (so `where`/`orderBy` do not create $vars)
    const varMap = collectVariablesFromSelections(
      schema,
      rootQueryType(schema),
      mergedSelections
    );
    const defs = Array.from(varMap.entries()).map(([name, { type, nonNull }]) =>
      makeVarDef(name, toNamedTypeNode(type), nonNull)
    );
    setVariableDefs(defs);

    // 4) Build and print
    const doc = buildOperation("query", rootFieldName, mergedSelections, defs);
    const printed = printDoc(doc);

    const comp = computeComplexity(schema, qField, mergedSelections);
    const warnLevel =
      comp >= DEFAULT_WEIGHTS.maxBlock
        ? "block"
        : comp >= DEFAULT_WEIGHTS.maxWarn
        ? "warn"
        : "ok";
    console.log("Generated query:", printed);
    return { queryText: printed, complexity: comp, warnLevel };
  }, [schema, rootFieldName, rootArgs, selection]);

  // Auto-computed variables from selection field args + root args (root wins on clashes)
  const computedVariables = useMemo(() => {
    const fromSelection = collectValuesFromSelections(selection, {});
    const merged: Record<string, unknown> = { ...fromSelection, ...rootArgs };
    // Only keep variables actually declared in the operation
    const opVarNames = new Set(variableDefs.map((d) => d.variable.name.value));
    const pruned: Record<string, unknown> = {};
    opVarNames.forEach((n) => {
      if (merged[n] !== undefined) pruned[n] = merged[n];
    });
    return pruned;
  }, [selection, rootArgs, variableDefs]);

  useEffect(() => {
    let names = variableDefs.map((d) => d.variable.name.value);
    if (!names.length)
      names = Array.from(
        new Set(
          Array.from((queryText || "").matchAll(/\$\w+/g)).map((m) =>
            m[0].slice(1)
          )
        )
      );
    setVariables((prev) => {
      const next: Record<string, unknown> = {};
      for (const n of names) next[n] = n in prev ? prev[n] : null;
      return next;
    });
  }, [variableDefs, queryText]);

  useEffect(() => {
    setVariables((prev) => {
      const next = { ...prev };
      const opVarNames = new Set(
        variableDefs.map((d) => d.variable.name.value)
      );
      for (const [k, v] of Object.entries(rootArgs)) {
        if (
          opVarNames.has(k) &&
          (next[k] === undefined || next[k] === null || next[k] === "")
        )
          next[k] = v as any;
      }
      return next;
    });
  }, [rootArgs, variableDefs]);

  async function runQuery() {
    if (!queryText) return;
    setLoading(true);
    setResult(null);
    const r = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        token: token || undefined,
        query: queryText,
        variables: computedVariables, // <<< use auto variables
      }),
    });
    const json = await r.json();
    setResult(json);
    setLoading(false);
  }

  // Template path lookup cache
  const templatePathCache = useRef<Record<string, string>>({});
  async function lookupTemplatePath(templateId: string) {
    if (templatePathCache.current[templateId])
      return templatePathCache.current[templateId];
    if (!templateId) return undefined;
    const query = `query TplPath($id: ID!, $language: String){ item(id: $id, language: $language){ path } }`;
    const body = {
      endpoint,
      token: token || undefined,
      query,
      variables: { id: `{${templateId}}` },
    };
    try {
      const r = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      const p = json?.data?.item?.path as string | undefined;
      if (p) templatePathCache.current[templateId] = p;
      return p;
    } catch {
      return undefined;
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr 1fr",
        height: "100vh",
        background: "var(--border-light)",
        gap: "1px",
      }}
    >
      <ConnectPanel
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        token={token}
        setToken={setToken}
        connect={connect}
        error={connectError}
        schema={schema}
      />
      <div style={{ background: "var(--bg-primary)" }}>
        {!schema ? (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3
              style={{
                margin: "0 0 var(--space-2) 0",
                color: "var(--text-primary)",
              }}
            >
              Connect to GraphQL
            </h3>
            <p style={{ margin: 0, fontSize: "1rem" }}>
              Enter your endpoint to get started
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid var(--border-light)",
                background: "var(--bg-secondary)",
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3h18v18H3zM9 9h6v6H9z" />
                </svg>
                Root Fields
              </h3>
            </div>
            <div style={{ padding: "16px", flexShrink: 0 }}>
              <RootFieldList
                schema={schema}
                selected={rootFieldName}
                onSelect={(n) => {
                  setRootFieldName(n);
                  setSelection([]);
                  setRootArgs({});
                }}
              />
            </div>
            {rootFieldName && (
              <div style={{ flex: 1, overflow: "auto" }}>
                {rootFieldName === "search" && (
                  <div style={{ padding: "0 16px" }}>
                    <SearchBuilder
                      group={searchGroup}
                      key={`search-${resetTick}`} 
                      setGroup={setSearchGroup}
                      conditions={searchConds}
                      setConditions={setSearchConds}
                      pageSize={pageSize}
                      setPageSize={setPageSize} // store UI value locally if you want
                      afterCursor={after}
                      setAfterCursor={setAfter}
                      onEmitArgs={(args) => {
                        // Send search args as LITERAL inputs so no $variables are used
                        // We attach them to rootArgs but mark as `literal` in merge below
                        // Easiest: store as-is here; we’ll mark as literal in the merge step
                        setRootArgs(args as any);
                      }}
                      ensureDefaultSelection={(defaults) => {
                        // If user hasn't selected anything under `search`, set a valid default
                        if (selection.length === 0) setSelection(defaults);
                      }}
                    />
                  </div>
                )}

                <SelectionPanel
                  schema={schema}
                  rootField={rootFieldName}
                  selection={selection}
                  onSelectionChange={setSelection}
                  rootArgs={rootArgs}
                  onRootArgsChange={setRootArgs}
                  onLookupTemplatePath={lookupTemplatePath}
                  templatePathCache={templatePathCache.current}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          background: "var(--bg-primary)",
          padding: "24px",
          overflowY: "auto",
        }}
      >
        <QueryPanel
          queryText={queryText}
          run={runQuery}
          canRun={!!queryText && warnLevel !== "block"}
          loading={loading}
          copy={() => navigator.clipboard.writeText(queryText)}
        />

        <div style={{ marginTop: "32px" }}>
          <h3
            style={{
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
            Complexity
          </h3>
          <ComplexityBar value={complexity} />
        </div>

        <div style={{ marginTop: "32px" }}>
          <h3
            style={{
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            Preview
          </h3>
          <div className="card">
            <pre
              style={{
                margin: 0,
                padding: "16px",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                maxHeight: "300px",
                overflow: "auto",
                background: "var(--bg-tertiary)",
                border: "none",
                borderRadius: "6px",
              }}
            >
              {result ? JSON.stringify(result, null, 2) : "No result yet."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeComplexity(
  schema: GraphQLSchema,
  rootField: GraphQLField<any, any>,
  selections: Selection[]
): number {
  const rootType = getNamedType(rootField.type);
  return walk(schema, rootType, selections, 0);
  function walk(
    sch: GraphQLSchema,
    parentType: any,
    sels: Selection[],
    depth: number
  ): number {
    let total = 0;
    const isUnion = !!(parentType as any).getTypes;
    const isInterface = !!(
      (sch as any).getPossibleTypes && (parentType as any).resolveType
    );
    if (isUnion || isInterface) {
      const children = sels.filter((s) => s.typeCondition);
      const possible = isUnion
        ? (parentType as any).getTypes()
        : (sch as any).getPossibleTypes(parentType);
      for (const c of children) {
        const t = possible.find((p: any) => p.name === c.typeCondition);
        if (t) total += walk(sch, t, c.children ?? [], depth + 1);
      }
      return total;
    }
    for (const sel of sels) {
      if (sel.typeCondition) continue;
      const f = parentType.getFields?.()[sel.field];
      if (!f) continue;
      const next = getNamedType(f.type);
      const info = {
        name: sel.field,
        args: sel.args?.length ?? 0,
        type: f.type,
        hasChildren: !!(sel.children && sel.children.length),
      } as any;
      total += scoreField(sch, info, depth);
      if (sel.children && sel.children.length)
        total += walk(sch, next, sel.children, depth + 1);
    }
    return total;
  }
}
