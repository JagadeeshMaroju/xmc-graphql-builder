import { useState, useEffect, useMemo } from "react";
import type { GraphQLSchema } from "graphql";
import { QueryPanel } from "@/components/panels/QueryPanel";
import { ComplexityBar } from "@/components/panels/ComplexityBar";
import { collectValuesFromSelections } from "@/utils/queryHelpers";
import { computeComplexity } from "@/utils/complexity";
import { getStoredCredentials } from "@/utils/credentials";
import {
  buildOperation,
  makeVarDef,
  printDoc,
  rootQueryType,
  collectVariablesFromSelections,
  toNamedTypeNode,
  mergeRootArgsIntoSelections,
} from "@/lib/graphql/ast";
import { DEFAULT_WEIGHTS } from "@/lib/graphql/complexity";

interface QueryPreviewProps {
  schema: GraphQLSchema | null;
  rootFieldName: string | null;
  rootArgs: Record<string, unknown>;
  selection: any[];
  appContext: any;
}

export function QueryPreview({ 
  schema, 
  rootFieldName, 
  rootArgs, 
  selection, 
  appContext 
}: QueryPreviewProps) {
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [variableDefs, setVariableDefs] = useState<
    import("graphql").VariableDefinitionNode[]
  >([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

    // 2.1) For the layout root, ensure default selection (keep arguments as variables)
    if (rootFieldName === "layout" && mergedSelectionsBase.length === 1) {
      const only = mergedSelectionsBase[0];

      // Ensure default selection if empty
      const hasChildren = (only.children ?? []).length > 0;
      const defaultChildren = [
        {
          field: "item",
          children: [{ field: "rendered" }],
        },
      ];

      mergedSelections = [
        {
          ...only,
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
    
    // Get current credentials
    const storedCreds = getStoredCredentials();
    const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
    const tokenToUse = xmCloudToken || storedCreds.token || "";
    const endpointToUse = storedCreds.endpoint || process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
    
    const r = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: endpointToUse,
        token: tokenToUse || undefined,
        query: queryText,
        variables: computedVariables, // <<< use auto variables
      }),
    });
    const json = await r.json();
    setResult(json);
    setLoading(false);
  }

  return (
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
  );
}
