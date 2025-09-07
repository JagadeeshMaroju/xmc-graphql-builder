import React, { useRef } from "react";
import type { GraphQLSchema } from "graphql";
import { RootFieldList } from "@/components/panels/RootFieldList";
import { SelectionPanel } from "@/components/tree/Tree";
import { SearchBuilder, SearchCondition } from "@/components/search/SearchBuilder";
import { getStoredCredentials } from "@/utils/credentials";

interface QueryBuilderProps {
  schema: GraphQLSchema;
  appContext: any;
  rootFieldName: string | null;
  setRootFieldName: (name: string | null) => void;
  rootArgs: Record<string, unknown>;
  setRootArgs: (args: Record<string, unknown>) => void;
  selection: any[];
  setSelection: (selection: any[]) => void;
  searchGroup: "AND" | "OR";
  setSearchGroup: (group: "AND" | "OR") => void;
  searchConds: SearchCondition[];
  setSearchConds: React.Dispatch<React.SetStateAction<SearchCondition[]>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  after: string;
  setAfter: (after: string) => void;
}

export function QueryBuilder({ 
  schema, 
  appContext,
  rootFieldName,
  setRootFieldName,
  rootArgs,
  setRootArgs,
  selection,
  setSelection,
  searchGroup,
  setSearchGroup,
  searchConds,
  setSearchConds,
  pageSize,
  setPageSize,
  after,
  setAfter,
}: QueryBuilderProps) {

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
                padding: "0",
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
                setPageSize={setPageSize}
                afterCursor={after}
                setAfterCursor={setAfter}
                onEmitArgs={(args) => {
                  // Send search args as LITERAL inputs so no $variables are used
                  // We attach them to rootArgs but mark as `literal` in merge below
                  // Easiest: store as-is here; we'll mark as literal in the merge step
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
  );
}
