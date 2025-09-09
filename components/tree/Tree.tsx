import { useState, useEffect, useCallback, useRef } from "react";
import type { GraphQLSchema, GraphQLField } from "graphql";
import {
  getNamedType,
  isInterfaceType,
  isObjectType,
  isUnionType,
} from "graphql";
import { rootQueryType, Selection } from "@/lib/graphql/ast";
import { parseTemplateInfo } from "@/lib/graphql/templateLabel";

export function SelectionPanel(props: {
  schema: GraphQLSchema;
  rootField: string;
  selection: Selection[];
  onSelectionChange: (s: Selection[]) => void;
  rootArgs: Record<string, unknown>;
  onRootArgsChange: (s: Record<string, unknown>) => void;
  onLookupTemplatePath: (id: string) => Promise<string | undefined>;
  templatePathCache: Record<string, string>;
  getItemTemplates: (itemPath: string, language?: string) => Promise<string[]>;
}) {
  const {
    schema,
    rootField,
    selection,
    onSelectionChange,
    rootArgs,
    onRootArgsChange,
  } = props;

  // Local state for immediate UI updates
  const [localArgs, setLocalArgs] = useState(rootArgs);

  // Update local state when rootArgs prop changes
  useEffect(() => {
    setLocalArgs(rootArgs);
  }, [rootArgs]);

  // Ref to store the timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Optimized debounced update
  const updateArgs = useCallback(
    (newArgs: Record<string, unknown>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onRootArgsChange(newArgs);
      }, 500); // Longer debounce for better performance
    },
    [onRootArgsChange]
  );

  // Immediate update for blur events
  const immediateUpdate = useCallback(
    (newArgs: Record<string, unknown>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onRootArgsChange(newArgs);
    },
    [onRootArgsChange]
  );
  const q = rootQueryType(schema).getFields()[rootField];
  const rootType = getNamedType(q.type);


  return (
    <div
      style={{
        padding: "24px",
        overflowY: "auto",
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border-light)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-light)",
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
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Selection</h2>
      </div>

      {rootField !== "search" && (
        <div
          style={{
            background: "var(--bg-primary)",
            borderRadius: "12px",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            border: "1px solid var(--border-light)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-light)",
              background: "var(--bg-secondary)",
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
              {rootField} Arguments
            </h3>
          </div>
          <div style={{ padding: "24px" }}>
            {q.args.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  margin: 0,
                  textAlign: "center",
                  padding: "16px",
                }}
              >
                No arguments required for this field.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {q.args.map((a) => (
                  <div
                    key={a.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "var(--text-primary)",
                        fontFamily:
                          "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                      }}
                    >
                      {a.name}{" "}
                      <em
                        style={{
                          color: "var(--text-muted)",
                          fontWeight: "normal",
                        }}
                      >
                        ({(a.type as any).toString()})
                      </em>
                    </label>
                    <input
                      key={a.name}
                      value={(localArgs as any)[a.name] ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const newLocalArgs = {
                          ...localArgs,
                          [a.name]: newValue,
                        };
                        setLocalArgs(newLocalArgs); // Immediate UI update
                        updateArgs(newLocalArgs); // Debounced parent update
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        const newLocalArgs = {
                          ...localArgs,
                          [a.name]: newValue,
                        };
                        immediateUpdate(newLocalArgs); // Immediate update on blur
                      }}
                      placeholder={`Enter ${a.name}...`}
                      style={{
                        margin: 0,
                        padding: "8px 12px",
                        border: "1px solid var(--border-light)",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        width: "100%",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isObjectType(rootType) ||
      isInterfaceType(rootType) ||
      isUnionType(rootType) ? (
                 <NodeFields
           schema={schema}
           parentType={rootType as any}
           selections={selection}
           onChange={onSelectionChange}
           onLookupTemplatePath={props.onLookupTemplatePath}
           templatePathCache={props.templatePathCache}
           getItemTemplates={props.getItemTemplates}
           rootField={rootField}
           rootArgs={rootArgs}
           selectionPath={[]}
         />
      ) : (
        <div
          style={{
            background: "var(--bg-primary)",
            borderRadius: "12px",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            border: "1px solid var(--border-light)",
            overflow: "hidden",
          }}
        >
          <div style={{ textAlign: "center", padding: "32px" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ marginBottom: "16px", opacity: 0.5 }}
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Root returns a scalar/enum — nothing to select.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function NodeFields({
  schema,
  parentType,
  selections,
  onChange,
  onLookupTemplatePath,
  templatePathCache,
  getItemTemplates,
  rootField,
  rootArgs,
  selectionPath = [],
}: {
  schema: GraphQLSchema;
  parentType: any;
  selections: Selection[];
  onChange: (s: Selection[]) => void;
  onLookupTemplatePath: (id: string) => Promise<string | undefined>;
  templatePathCache: Record<string, string>;
  getItemTemplates?: (itemPath: string, language?: string) => Promise<string[]>;
  rootField?: string;
  rootArgs?: Record<string, unknown>;
  selectionPath?: string[];
}) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [itemTemplates, setItemTemplates] = useState<string[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const perPage = 8;

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Load templates based on selection context
  useEffect(() => {
    async function loadItemTemplates() {
      // Only filter templates for direct item queries at root level
      // For nested item fields (like children, related items), show all templates
      const isRootLevelItemQuery = rootField === "item" && selectionPath.length === 0;
      
      if (
        isRootLevelItemQuery && 
        getItemTemplates && 
        rootArgs?.path &&
        typeof rootArgs.path === "string"
      ) {
        setIsLoadingTemplates(true);
        try {
          const templates = await getItemTemplates(
            rootArgs.path as string, 
            rootArgs.language as string
          );
          
          setItemTemplates(templates);
        } catch (error) {
          console.error("Failed to load item templates:", error);
          setItemTemplates([]);
        } finally {
          setIsLoadingTemplates(false);
        }
      } else {
        // For nested item selections or other queries, don't filter templates
        setItemTemplates([]);
      }
    }

    loadItemTemplates();
  }, [rootField, rootArgs?.path, rootArgs?.language, getItemTemplates, selectionPath]);

  if (isUnionType(parentType) || isInterfaceType(parentType)) {
    const types = isUnionType(parentType)
      ? parentType.getTypes()
      : schema.getPossibleTypes(parentType);
    
    let entries = types.map((t: any) => {
      const info = parseTemplateInfo(t.name);
      const path = info.id ? templatePathCache[info.id] : undefined;
      return { t, pretty: info.pretty, id: info.id, path };
    });

    // Filter by item templates if available and "Show All" is not checked
    if (itemTemplates.length > 0 && !showAllTemplates) {
      
      // Templates to exclude from the list
      const excludedTemplates = [
        'Advanced', 'Appearance', 'Help', 'Layout', 'Lifetime', 'Indexing',
        'Insert Options', 'Item Buckets', 'Publishing', 'Security', 'Statistics',
        'Tagging', 'Tasks', 'Validators', 'Workflow', 'Version'
      ];
      
      entries = entries.filter((e) => {
        const info = parseTemplateInfo(e.t.name);
        
        // Check if this template should be excluded
        const isExcluded = excludedTemplates.some(excludedTemplate => 
          info.pretty.toLowerCase() === excludedTemplate.toLowerCase() ||
          e.t.name.toLowerCase().includes(excludedTemplate.toLowerCase())
        );
        
        if (isExcluded) {
          return false;
        }
        
        return itemTemplates.some(templateName => {
          // Try multiple matching strategies
          const matches = [
            // Exact GraphQL type name match
            e.t.name === templateName,
            // Pretty name match (case insensitive)
            info.pretty.toLowerCase() === templateName.toLowerCase(),
            // Template name with common variations
            info.pretty.toLowerCase().replace(/\s+/g, '') === templateName.toLowerCase().replace(/\s+/g, ''),
            // Try removing common prefixes/suffixes
            info.pretty.toLowerCase().replace(/template$/i, '').trim() === templateName.toLowerCase().replace(/template$/i, '').trim(),
            // Try with "Template" suffix added to the API template name
            info.pretty.toLowerCase() === (templateName + ' template').toLowerCase(),
            // Try partial matches for compound names
            info.pretty.toLowerCase().includes(templateName.toLowerCase()) && templateName.length > 3,
            templateName.toLowerCase().includes(info.pretty.toLowerCase()) && info.pretty.length > 3
          ];
          
          const matched = matches.some(Boolean);
          if (matched) {
          }
          return matched;
        });
      });
      
      // Sort entries alphabetically by pretty name
      entries.sort((a, b) => {
        const aPretty = parseTemplateInfo(a.t.name).pretty;
        const bPretty = parseTemplateInfo(b.t.name).pretty;
        return aPretty.localeCompare(bPretty);
      });
      
      // Log unmatched templates
      const unmatchedTemplates = itemTemplates.filter(templateName => 
        !types.some((t: any) => {
          const info = parseTemplateInfo(t.name);
          return [
            t.name === templateName,
            info.pretty.toLowerCase() === templateName.toLowerCase(),
            info.pretty.toLowerCase().replace(/\s+/g, '') === templateName.toLowerCase().replace(/\s+/g, ''),
            info.pretty.toLowerCase().replace(/template$/i, '').trim() === templateName.toLowerCase().replace(/template$/i, '').trim(),
            info.pretty.toLowerCase() === (templateName + ' template').toLowerCase(),
            info.pretty.toLowerCase().includes(templateName.toLowerCase()) && templateName.length > 3,
            templateName.toLowerCase().includes(info.pretty.toLowerCase()) && info.pretty.length > 3
          ].some(Boolean);
        })
      );
      
      if (unmatchedTemplates.length > 0) {
        console.warn("⚠️ Templates from API that didn't match any GraphQL types:", unmatchedTemplates);
      }
    }
    
    const lower = filter.trim().toLowerCase();
    const filtered = lower
      ? entries.filter(
          (e) =>
            e.pretty.toLowerCase().includes(lower) ||
            (e.id && e.id.toLowerCase().includes(lower)) ||
            (e.path && e.path.toLowerCase().includes(lower)) ||
            e.t.name.toLowerCase().includes(lower)
        )
      : entries;

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageEntries = filtered.slice(start, end);

    return (
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "12px",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: "1px solid var(--border-light)",
          overflow: "hidden",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--bg-secondary)",
          }}
        >
                       <h3
               style={{
                 margin: 0,
                 display: "flex",
                 alignItems: "center",
                 gap: "8px",
                 fontSize: "1rem",
               }}
             >
               <svg
                 width="16"
                 height="16"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="2"
               >
                 <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
               </svg>
               Template Types ({filtered.length})
               {itemTemplates.length > 0 && !showAllTemplates && (
                 <span style={{
                   fontSize: "0.75rem",
                   color: "var(--primary)",
                   background: "var(--primary-light)",
                   padding: "2px 6px",
                   borderRadius: "4px",
                   fontWeight: "600"
                 }}>
                   FILTERED FOR ITEM
                 </span>
               )}
               {itemTemplates.length > 0 && showAllTemplates && (
                 <span style={{
                   fontSize: "0.75rem",
                   color: "var(--text-secondary)",
                   background: "var(--bg-tertiary)",
                   padding: "2px 6px",
                   borderRadius: "4px",
                   fontWeight: "500"
                 }}>
                   SHOWING ALL TEMPLATES
                 </span>
               )}
               {selectionPath.length > 0 && itemTemplates.length === 0 && (
                 <span style={{
                   fontSize: "0.75rem",
                   color: "var(--text-secondary)",
                   background: "var(--bg-tertiary)",
                   padding: "2px 6px",
                   borderRadius: "4px",
                   fontWeight: "500"
                 }}>
                   NESTED FIELD - ALL TEMPLATES
                 </span>
               )}
               {isLoadingTemplates && (
                 <span style={{
                   fontSize: "0.75rem",
                   color: "var(--text-muted)",
                   fontStyle: "italic"
                 }}>
                   Loading templates...
                 </span>
               )}
             </h3>
        </div>
        <div style={{ padding: "16px" }}>
          {/* Template filtering controls */}
          {itemTemplates.length > 0 && (
            <div style={{
              marginBottom: "16px",
              padding: "16px",
              background: showAllTemplates ? "var(--bg-tertiary)" : "var(--primary-light)",
              borderRadius: "8px",
              border: showAllTemplates ? "1px solid var(--border-medium)" : "1px solid var(--primary)",
              transition: "all 0.2s ease"
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
              }}>
                {/* Custom styled checkbox */}
                <div 
                  onClick={() => setShowAllTemplates(!showAllTemplates)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: showAllTemplates ? "2px solid var(--text-secondary)" : "2px solid var(--primary)",
                    background: showAllTemplates ? "var(--text-secondary)" : "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                    marginTop: "1px"
                  }}
                >
                  {showAllTemplates && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {!showAllTemplates && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div 
                    onClick={() => setShowAllTemplates(!showAllTemplates)}
                    style={{
                      cursor: "pointer",
                      marginBottom: "4px"
                    }}
                  >
                    <span style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: showAllTemplates ? "var(--text-secondary)" : "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      Show all templates
                      {showAllTemplates && (
                        <span style={{
                          fontSize: "0.7rem",
                          background: "var(--text-secondary)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          fontWeight: "500"
                        }}>
                          ON
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    lineHeight: "1.3"
                  }}>
                    {showAllTemplates ? (
                      <>
                        <span style={{ fontWeight: "500" }}>All {types.length} templates</span> are now visible for maximum flexibility
                      </>
                    ) : (
                      <>
                        Showing <span style={{ fontWeight: "500" }}>{filtered.length} item-specific templates</span> for focused selection
                      </>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: showAllTemplates ? "var(--text-secondary)" : "var(--primary)",
                  flexShrink: 0,
                  marginTop: "5px"
                }} />
              </div>
            </div>
          )}
          
          <input
            placeholder="Filter template name / id / path…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "16px",
              padding: "12px",
              border: "1px solid var(--border-light)",
              borderRadius: "6px",
              fontSize: "0.875rem",
            }}
          />

          {/* Pagination Controls */}
          {filtered.length > perPage && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                padding: "12px",
                background: "var(--bg-tertiary)",
                borderRadius: "6px",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Page {page} of {totalPages} • Showing {start + 1}-
                {Math.min(end, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "4px",
                    background:
                      page === 1 ? "var(--bg-secondary)" : "var(--bg-primary)",
                    color:
                      page === 1 ? "var(--text-muted)" : "var(--text-primary)",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "4px",
                    background:
                      page === totalPages
                        ? "var(--bg-secondary)"
                        : "var(--bg-primary)",
                    color:
                      page === totalPages
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  Next →
                </button>
                {totalPages > 5 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Go to:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={page}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value);
                        if (newPage >= 1 && newPage <= totalPages) {
                          setPage(newPage);
                        }
                      }}
                      style={{
                        width: "50px",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        border: "1px solid var(--border-light)",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pageEntries.map(({ t, pretty, id, path }) => (
              <details
                key={t.name}
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "12px",
                    cursor: "pointer",
                    background: "var(--bg-secondary)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                  >
                    {pretty}
                  </span>
                  <em
                    style={{
                      color: "var(--text-muted)",
                      marginLeft: "6px",
                      fontSize: "0.75rem",
                    }}
                  >
                    ({t.name})
                  </em>
                  {id && (
                    <span
                      style={{
                        marginLeft: "8px",
                        color: "var(--text-secondary)",
                        fontSize: "0.75rem",
                      }}
                    >
                      • id: {id}
                    </span>
                  )}
                  {path && (
                    <span
                      style={{
                        marginLeft: "8px",
                        color: "var(--text-secondary)",
                        fontSize: "0.75rem",
                      }}
                    >
                      • path: {path}
                    </span>
                  )}
                </summary>
                <div
                  style={{ padding: "16px", background: "var(--bg-primary)" }}
                >
                  <NodeFields
                    schema={schema}
                    parentType={t}
                    selections={selectionsForType(selections, t.name)}
                    onChange={(child) =>
                      onChange(mergeInline(selections, t.name, child))
                    }
                    onLookupTemplatePath={onLookupTemplatePath}
                    templatePathCache={templatePathCache}
                    getItemTemplates={getItemTemplates}
                    rootField={rootField}
                    rootArgs={rootArgs}
                    selectionPath={[...selectionPath, t.name]}
                  />
                </div>
              </details>
            ))}

            {/* No results message */}
            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "var(--text-muted)",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ marginBottom: "16px", opacity: 0.5 }}
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p style={{ margin: 0 }}>
                  {filter
                    ? "No templates found matching your search."
                    : "No template types available."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  const fields: GraphQLField<any, any>[] = Object.values(
    parentType.getFields()
  );
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        borderRadius: "12px",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-light)",
          background: "var(--bg-secondary)",
        }}
      >
        <h3
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "1rem",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 3h18v18H3zM9 9h6v6H9z" />
          </svg>
          Fields
        </h3>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {fields.map((f) => {
            const exists = selections.find(
              (s) => s.field === f.name && !s.typeCondition
            );
            const nextType = getNamedType(f.type);
            const isLeaf =
              !isObjectType(nextType) &&
              !isInterfaceType(nextType) &&
              !isUnionType(nextType);
            return (
              <div
                key={f.name}
                style={{
                  border: exists
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border-light)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  background: exists
                    ? "var(--primary-light)"
                    : "var(--bg-primary)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!exists) {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.borderColor = "var(--border-medium)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!exists) {
                    e.currentTarget.style.background = "var(--bg-primary)";
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    margin: 0,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!exists}
                      onChange={(e) => {
                        if (e.target.checked)
                          onChange([...selections, { field: f.name }]);
                        else
                          onChange(
                            selections.filter(
                              (s) => !(s.field === f.name && !s.typeCondition)
                            )
                          );
                      }}
                      style={{
                        accentColor: "var(--primary)",
                        transform: "scale(1.2)",
                        margin: 0,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                        fontSize: "0.875rem",
                        fontWeight: exists ? "600" : "500",
                        color: exists
                          ? "var(--primary)"
                          : "var(--text-primary)",
                        lineHeight: "1.2",
                      }}
                    >
                      {f.name}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        fontStyle: "italic",
                        lineHeight: "1.2",
                      }}
                    >
                      {nextType.name}
                    </span>
                  </div>
                  {exists && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        opacity: 0.6,
                      }}
                    />
                  )}
                </label>
                {!!exists && f.args.length > 0 && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          fontWeight: "600",
                        }}
                      >
                        Field Arguments
                      </h4>
                      {f.args.map((a) => (
                        <div
                          key={a.name}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr",
                            gap: "12px",
                            alignItems: "center",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                              fontFamily:
                                "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                              fontWeight: "500",
                            }}
                          >
                            {a.name}{" "}
                            <em style={{ color: "var(--text-muted)" }}>
                              ({(a.type as any).toString()})
                            </em>
                          </label>
                          <input
                            value={
                              (exists?.args?.find((x) => x.name === a.name)
                                ?.value as any) ?? ""
                            }
                            onChange={(e) => {
                              const args = [...(exists?.args ?? [])];
                              const idx = args.findIndex(
                                (x) => x.name === a.name
                              );
                              if (idx >= 0)
                                args[idx] = {
                                  ...args[idx],
                                  value: e.target.value,
                                  type: a.type,
                                };
                              else
                                args.push({
                                  name: a.name,
                                  type: a.type,
                                  value: e.target.value,
                                });
                              onChange(
                                selections.map((s) =>
                                  s === exists ? { ...s, args } : s
                                )
                              );
                            }}
                            placeholder={`Enter ${a.name}...`}
                            style={{
                              fontSize: "0.75rem",
                              padding: "8px 12px",
                              border: "1px solid var(--border-light)",
                              borderRadius: "4px",
                              background: "var(--bg-primary)",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!exists && !isLeaf && (
                  <div style={{ marginTop: "16px" }}>
                    <NodeFields
                      schema={schema}
                      parentType={nextType}
                      selections={exists.children ?? []}
                      onChange={(child) =>
                        onChange(
                          selections.map((s) =>
                            s === exists ? { ...s, children: child } : s
                          )
                        )
                      }
                      onLookupTemplatePath={onLookupTemplatePath}
                      templatePathCache={templatePathCache}
                      getItemTemplates={getItemTemplates}
                      rootField={rootField}
                      rootArgs={rootArgs}
                      selectionPath={[...selectionPath, f.name]}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function selectionsForType(
  selections: Selection[],
  typeName: string
): Selection[] {
  const found = selections.find((s) => s.typeCondition === typeName);
  return found?.children ?? [];
}
function mergeInline(
  selections: Selection[],
  typeName: string,
  child: Selection[]
): Selection[] {
  const idx = selections.findIndex((s) => s.typeCondition === typeName);

  // If user unchecked everything under this template, drop the fragment entirely
  if (!child || child.length === 0) {
    return selections.filter((s) => s.typeCondition !== typeName);
  }

  if (idx === -1) {
    return [
      ...selections,
      { field: "__inline__", typeCondition: typeName, children: child },
    ];
  }

  const copy = [...selections];
  copy[idx] = { ...copy[idx], children: child };
  return copy;
}
