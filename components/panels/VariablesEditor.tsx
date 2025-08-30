export function VariablesEditor({ variables, onChange }:{ variables: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; }){
  const entries = Object.entries(variables);
  return (
    <div className="card">
      <div className="card-body">
        {entries.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-8)',
            color: 'var(--text-muted)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }}>
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No variables inferred yet</p>
            <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '0.75rem' }}>Add arguments to fields to see variables here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {entries.map(([k,v]) => (
              <div key={k} style={{ 
                display: 'grid', 
                gridTemplateColumns: '140px 1fr',
                gap: 'var(--space-3)',
                alignItems: 'center'
              }}>
                <label style={{ 
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace'
                }}>
                  {k}
                </label>
                <input 
                  value={(v as any) ?? ''} 
                  onChange={e => onChange({ ...variables, [k]: e.target.value })}
                  placeholder="Enter value..."
                  style={{ margin: 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
