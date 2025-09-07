import { useConnection } from "@/hooks/useConnection";
import { useQueryState } from "@/hooks/useQueryState";
import { ConnectionPanel } from "@/components/panels/ConnectionPanel";
import { QueryBuilder } from "@/components/QueryBuilder";
import { QueryPreview } from "@/components/QueryPreview";
import SchemaExplorer from "@/components/SchemaExplorer";

export function MainApp() {
  const { schema, connectError, isAutoConnecting, appContext } = useConnection();
  const {
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
  } = useQueryState();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "400px 3fr 4fr",
        height: "100vh",
        background: "var(--border-light)",
        gap: "2px",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Left Sidebar */}
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
        
        <ConnectionPanel 
          isAutoConnecting={isAutoConnecting}
          connectError={connectError}
          schema={schema}
        />

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

      {/* Middle Panel - Query Builder */}
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
          <QueryBuilder 
            schema={schema} 
            appContext={appContext}
            rootFieldName={rootFieldName}
            setRootFieldName={setRootFieldName}
            rootArgs={rootArgs}
            setRootArgs={setRootArgs}
            selection={selection}
            setSelection={setSelection}
            searchGroup={searchGroup}
            setSearchGroup={setSearchGroup}
            searchConds={searchConds}
            setSearchConds={setSearchConds}
            pageSize={pageSize}
            setPageSize={setPageSize}
            after={after}
            setAfter={setAfter}
          />
        )}
      </div>

      {/* Right Panel - Query Preview */}
      <QueryPreview 
        schema={schema}
        rootFieldName={rootFieldName}
        rootArgs={rootArgs}
        selection={selection}
        appContext={appContext}
      />
    </div>
  );
}
