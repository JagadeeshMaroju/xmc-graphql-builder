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
    <div className="main-app">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <div className="header-section">
          <div className="header-icon">
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
            <h2 className="header-title">
              GraphQL Query Builder
            </h2>
            <p className="header-subtitle">
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
      <div className="middle-panel">
        {!schema ? (
          <div className="connect-message">
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
              animation: "spin 20s linear infinite"
            }}></div>
            <div className="connect-icon">
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
              <h3 className="connect-title">
                Connect to GraphQL
              </h3>
              <p className="connect-description">
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
