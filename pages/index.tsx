import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
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
import { useMarketplaceClient } from "@/lib/hooks/useMarketplaceClient";

import { RootFieldList } from "@/components/panels/RootFieldList";
import { SelectionPanel } from "@/components/tree/Tree";
import { ComplexityBar } from "@/components/panels/ComplexityBar";
import { QueryPanel } from "@/components/panels/QueryPanel";
import SchemaExplorer from "@/components/SchemaExplorer";
import {
  SearchBuilder,
  type SearchCondition,
} from "@/components/search/SearchBuilder";
import {
  ApplicationContext,
  QueryResult,
} from "@sitecore-marketplace-sdk/client";

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

// Helper functions for localStorage
const getStoredCredentials = () => {
  if (typeof window === "undefined") {
    console.log("🌐 Server-side: returning empty credentials");
    return { endpoint: "", token: "" };
  }
  try {
    const stored = localStorage.getItem("graphql-builder-credentials");
    console.log("💾 Raw stored data:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 Parsed credentials:", parsed);
      return {
        endpoint: parsed.endpoint || "",
        token: parsed.token || "",
      };
    }
  } catch (error) {
    console.warn("Failed to load stored credentials:", error);
  }
  console.log("❌ No stored credentials found");
  return { endpoint: "", token: "" };
};

const saveCredentials = (endpoint: string, token: string) => {
  if (typeof window === "undefined") {
    console.log("🌐 Server-side: cannot save credentials");
    return;
  }
  try {
    const credentials = {
      endpoint,
      token,
      savedAt: new Date().toISOString(),
    };
    console.log("💾 Saving credentials:", {
      endpoint,
      token: token ? `${token.substring(0, 10)}...` : 'empty',
      savedAt: credentials.savedAt,
    });
    localStorage.setItem(
      "graphql-builder-credentials",
      JSON.stringify(credentials)
    );
    console.log("✅ Credentials saved successfully");
  } catch (error) {
    console.warn("Failed to save credentials:", error);
  }
};

const clearStoredCredentials = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("graphql-builder-credentials");
  } catch (error) {
    console.warn("Failed to clear credentials:", error);
  }
};

export default function Home() {
  const { client, error, isInitialized, isLoading } = useMarketplaceClient();
  const [appContext, setAppContext] = useState<ApplicationContext>();

  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res: QueryResult<"application.context">) => {
          setAppContext(res.data);
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });
    }
  }, [client, error, isInitialized]);
  const storedCreds = getStoredCredentials();

  // search-specific UI state (if not already present)
  const [searchGroup, setSearchGroup] = useState<"AND" | "OR">("AND");
  const [searchConds, setSearchConds] = useState<any[]>([]);

  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

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

  }, [rootFieldName]);


  // Load schema directly on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Don't run if we already have a schema or are currently loading
    if (schema || isAutoConnecting) return;

    console.log("🚀 Loading schema directly on page load...");

    setIsAutoConnecting(true);
    setConnectError(null);

    // Load schema immediately
    (async () => {
      try {
        // Use XM Cloud token if available, otherwise use stored token, otherwise empty
        const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
        const storedCreds = getStoredCredentials();
        const tokenToUse = xmCloudToken || storedCreds.token || "";
        
        // Use stored endpoint or environment variable
        const endpointToUse = storedCreds.endpoint || process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
        
        console.log("📋 Using credentials:", {
          endpoint: endpointToUse,
          hasToken: !!tokenToUse,
          tokenSource: xmCloudToken ? 'XM Cloud' : storedCreds.token ? 'stored' : 'none',
        });

        if (!endpointToUse) {
          throw new Error("No endpoint available. Please set NEXT_PUBLIC_XM_ENDPOINT environment variable.");
        }

        if (!tokenToUse) {
          throw new Error("No authentication token available. Please ensure you're running in XM Cloud or have stored credentials.");
        }

    const parsed = ConnectSchema.safeParse({
          endpoint: endpointToUse,
          token: tokenToUse,
    });

    if (!parsed.success) {
          throw new Error(
            parsed.error.errors[0]?.message || "Invalid credentials"
          );
    }

        console.log("Making API call to /api/schema...");
    const r = await fetch("/api/schema", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "Content-Type": "application/json" },
    });

    const json = await r.json();
    if (!r.ok || json.error) {
          throw new Error(json.error || "Failed to introspect.");
    }

    const sch = buildSchemaFromIntrospection(json);
    setSchema(sch);
        
        // Save credentials for future use
        if (endpointToUse && tokenToUse) {
          saveCredentials(endpointToUse, tokenToUse);
        }
        
        console.log("✅ Schema loaded successfully");
      } catch (error) {
        console.error("Schema loading failed:", error);
        setConnectError("Failed to load schema: " + (error as Error).message);
      } finally {
        setIsAutoConnecting(false);
      }
    })();
  }, [appContext]); // Re-run when XM Cloud context becomes available


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

  // Template path lookup cache
  const templatePathCache = useRef<Record<string, string>>({});
  async function lookupTemplatePath(templateId: string) {
    if (templatePathCache.current[templateId])
      return templatePathCache.current[templateId];
    if (!templateId) return undefined;
    const query = `query TplPath($id: ID!, $language: String){ item(id: $id, language: $language){ path } }`;
    // Get current credentials
    const storedCreds = getStoredCredentials();
    const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
    const tokenToUse = xmCloudToken || storedCreds.token || "";
    const endpointToUse = storedCreds.endpoint || process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
    
    const body = {
      endpoint: endpointToUse,
      token: tokenToUse || undefined,
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

  // Get templates for a specific item path (template + inherited templates)
  const itemTemplateCache = useRef<Record<string, string[]>>({});
  async function getItemTemplates(
    itemPath: string,
    language?: string
  ): Promise<string[]> {
    const cacheKey = `${itemPath}|${language || "en"}`;
    if (itemTemplateCache.current[cacheKey]) {
      return itemTemplateCache.current[cacheKey];
    }

    if (!itemPath) return [];

    // Query to get template information including inheritance chain
    const query = `query GetItemTemplates($path: String!, $language: String!) {
      item(path: $path, language: $language) {
        template {
          name
          baseTemplates {
            name
          }
        }
      }
    }`;

    // Get current credentials
    const storedCreds = getStoredCredentials();
    const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
    const tokenToUse = xmCloudToken || storedCreds.token || "";
    const endpointToUse = storedCreds.endpoint || process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
    
    const body = {
      endpoint: endpointToUse,
      token: tokenToUse || undefined,
      query,
      variables: { path: itemPath, language: language || "en" },
    };

    try {
      const r = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();

      const templates: string[] = [];
      const template = json?.data?.item?.template;

      if (template?.name) {
        templates.push(template.name);

        // Add base templates (inheritance chain)
        if (template.baseTemplates) {
          for (const baseTemplate of template.baseTemplates) {
            if (baseTemplate.name) {
              templates.push(baseTemplate.name);
            }
          }
        }
      }

      // Cache the result
      itemTemplateCache.current[cacheKey] = templates;
      return templates;
    } catch (error) {
      console.error("Failed to fetch item templates:", error);
      return [];
    }
  }

  return (
    <>
      <Head>
        <title>Sitecore GraphQL Query Builder</title>
        <meta
          name="description"
          content="Build and test GraphQL queries for Sitecore"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    <div
      style={{
        display: "grid",
          gridTemplateColumns: "400px 1fr 1fr",
        height: "100vh",
        background: "var(--border-light)",
          gap: "2px",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div style={{ 
          background: "var(--bg-primary)",
          padding: "var(--space-8) var(--space-6)",
          overflowY: "auto",
          borderRight: "1px solid var(--border-light)",
          minHeight: "100vh"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "var(--space-5)",
            marginBottom: "var(--space-10)",
            paddingBottom: "var(--space-8)",
            borderBottom: "1px solid var(--border-light)",
            position: "relative"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
              position: "relative",
              overflow: "hidden"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <div style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "12px",
                height: "12px",
                background: "#10b981",
                borderRadius: "50%",
                border: "2px solid white",
                animation: "pulse 2s infinite"
              }}></div>
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: "1.75rem", 
                fontWeight: "700",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                GraphQL Builder
              </h2>
              <p style={{ 
                margin: "4px 0 0 0", 
                fontSize: "0.9rem", 
                color: "var(--text-secondary)",
                fontWeight: "500"
              }}>
                Build and test GraphQL queries with ease
              </p>
            </div>
          </div>
          

          {/* Connection Status */}
          {isAutoConnecting && (
            <div style={{
              marginBottom: "var(--space-4)",
              padding: "var(--space-4)",
              background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
              border: "1px solid #ffc107",
              borderRadius: "12px",
              fontSize: "0.9rem",
              color: "#856404",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(255, 193, 7, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "3px solid #856404",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  Loading GraphQL Schema...
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  Please wait while we connect to your GraphQL endpoint
                </div>
              </div>
              <div style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                background: "#ffc107",
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></div>
            </div>
          )}

          {connectError && (
            <div style={{
              marginBottom: "var(--space-4)",
              padding: "var(--space-4)",
              background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
              border: "1px solid #dc3545",
              borderRadius: "12px",
              fontSize: "0.9rem",
              color: "#721c24",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(220, 53, 69, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#dc3545",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  Connection Error
                </div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
                  {connectError}
                </div>
              </div>
              <div style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                background: "#dc3545",
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></div>
            </div>
          )}

          {schema && (
            <div style={{
              marginBottom: "var(--space-10)",
              padding: "var(--space-4) var(--space-5)",
              background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
              border: "1px solid #28a745",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#155724",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative"
            }}>
              <div style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: "600", 
                  fontSize: "0.9rem",
                  color: "#155724"
                }}>
                  Connected & Ready
                </div>
              </div>
            </div>
          )}

          {/* Schema Explorer */}
          {schema && (
            <div style={{
              background: "var(--bg-primary)",
              borderRadius: "8px",
              padding: "var(--space-5)",
              border: "1px solid var(--border-light)",
              marginTop: "var(--space-10)"
            }}>
              <SchemaExplorer schema={schema} />
            </div>
          )}
        </div>
        <div style={{ 
          background: "var(--bg-primary)",
          boxShadow: "inset 1px 0 0 var(--border-light)",
          position: "relative"
        }}>
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
                background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
                animation: "spin 20s linear infinite"
              }}></div>
            <div
              style={{
                  width: "80px",
                  height: "80px",
                borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                  marginBottom: "var(--space-6)",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)"
              }}
            >
              <svg
                  width="36"
                  height="36"
                viewBox="0 0 24 24"
                fill="none"
                  stroke="white"
                  strokeWidth="2.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
              <div style={{ position: "relative", zIndex: 1 }}>
            <h3
              style={{
                    margin: "0 0 var(--space-3) 0",
                color: "var(--text-primary)",
                    fontSize: "1.5rem",
                    fontWeight: "600"
              }}
            >
              Connect to GraphQL
            </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  maxWidth: "400px"
                }}>
                  Enter your endpoint to get started building queries
                </p>
              </div>
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
                <div style={{ flex: 1, overflow: "visible" }}>
                {rootFieldName === "search" && (
                    <div
                      style={{
                        padding: "0 16px",
                        overflow: "visible",
                        position: "relative",
                      }}
                    >
                    <SearchBuilder
                      group={searchGroup}
                        key="search"
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
                    getItemTemplates={getItemTemplates}
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
    </>
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
