import { GraphQLSchema } from 'graphql';
import SchemaExplorer from '@/components/SchemaExplorer';

export function ConnectPanel({ endpoint, setEndpoint, token, setToken, connect, error, schema, onClearCredentials, isAutoConnecting, isConnecting }:{
  endpoint: string; setEndpoint: (s: string) => void; token: string; setToken: (s: string) => void; connect: () => void; error: string | null; schema: GraphQLSchema | null; onClearCredentials?: () => void; isAutoConnecting?: boolean; isConnecting?: boolean;
}){
  return (
    <div style={{ 
      background: "var(--bg-primary)",
      padding: "var(--space-6)",
      overflowY: "auto",
      borderRight: "1px solid var(--border-light)"
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "var(--space-3)",
        marginBottom: "var(--space-6)",
        paddingBottom: "var(--space-4)",
        borderBottom: "1px solid var(--border-light)"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-lg)",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>GraphQL Builder</h2>
      </div>
      
      <div style={{ marginBottom: "var(--space-6)" }}>
        <label>Endpoint URL</label>
        <input 
          value={endpoint} 
          onChange={e=>setEndpoint(e.target.value)} 
          placeholder="https://your-api.com/graphql" 
          disabled={!!schema}
          style={{ 
            marginBottom: "var(--space-4)",
            opacity: schema ? 0.7 : 1,
            cursor: schema ? "not-allowed" : "text"
          }}
        />
        
        <label>sc_apikey</label>
        <input 
          value={token} 
          onChange={e=>setToken(e.target.value)} 
          placeholder="Bearer token (optional)" 
          disabled={!!schema}
          style={{ 
            marginBottom: "var(--space-4)",
            opacity: schema ? 0.7 : 1,
            cursor: schema ? "not-allowed" : "text"
          }}
        />
        
        <button 
          onClick={connect} 
          disabled={isAutoConnecting || isConnecting || !!schema}
          style={{ 
            width: "100%",
            padding: "var(--space-4)",
            fontSize: "1rem",
            fontWeight: "600",
            opacity: (isAutoConnecting || isConnecting || schema) ? 0.7 : 1,
            cursor: (isAutoConnecting || isConnecting || schema) ? "not-allowed" : "pointer",
          }}
        >
          {isAutoConnecting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "var(--space-2)", animation: "spin 1s linear infinite" }}>
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              Auto-connecting...
            </>
          ) : isConnecting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "var(--space-2)", animation: "spin 1s linear infinite" }}>
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              Connecting...
            </>
          ) : schema ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "var(--space-2)" }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
              Connected & Ready
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "var(--space-2)" }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M13 8H7"/>
                <path d="M17 12H7"/>
              </svg>
              Connect & Introspect
            </>
          )}
        </button>
        
        {onClearCredentials && (endpoint || token) && (
          <button
            onClick={() => {
              onClearCredentials();
            }}
            className="secondary"
            style={{
              width: "100%",
              marginTop: "var(--space-3)",
              padding: "var(--space-3)",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
            </svg>
            Clear Saved Credentials
          </button>
        )}
        
        {error && (
          <div style={{ 
            marginTop: "var(--space-4)",
            padding: "var(--space-3)",
            background: "var(--error)",
            color: "white",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
      </div>
      
      {schema && (
        <div style={{ 
          padding: "var(--space-4)",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
            color: "var(--success)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>Connected</span>
          </div>
          <SchemaExplorer schema={schema} />
        </div>
      )}
    </div>
  );
}
