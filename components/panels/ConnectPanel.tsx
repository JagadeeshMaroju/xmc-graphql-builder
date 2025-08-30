import { GraphQLSchema } from 'graphql';
import SchemaExplorer from '@/components/SchemaExplorer';

export function ConnectPanel({ endpoint, setEndpoint, token, setToken, connect, error, schema }:{
  endpoint: string; setEndpoint: (s: string) => void; token: string; setToken: (s: string) => void; connect: () => void; error: string | null; schema: GraphQLSchema | null;
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
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>GraphQL Explorer</h2>
      </div>
      
      <div style={{ marginBottom: "var(--space-6)" }}>
        <label>Endpoint URL</label>
        <input 
          value={endpoint} 
          onChange={e=>setEndpoint(e.target.value)} 
          placeholder="https://your-api.com/graphql" 
          style={{ marginBottom: "var(--space-4)" }}
        />
        
        <label>sc_apikey</label>
        <input 
          value={token} 
          onChange={e=>setToken(e.target.value)} 
          placeholder="Bearer token (optional)" 
          style={{ marginBottom: "var(--space-4)" }}
        />
        
        <button 
          onClick={connect} 
          style={{ 
            width: "100%",
            padding: "var(--space-4)",
            fontSize: "1rem",
            fontWeight: "600"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "var(--space-2)" }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M13 8H7"/>
            <path d="M17 12H7"/>
          </svg>
          Connect & Introspect
        </button>
        
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
