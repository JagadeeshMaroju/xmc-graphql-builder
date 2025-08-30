import { DEFAULT_WEIGHTS } from '@/lib/graphql/complexity';

export function ComplexityBar({ value }:{ value:number }){
  const warn = DEFAULT_WEIGHTS.maxWarn;
  const block = DEFAULT_WEIGHTS.maxBlock;
  const pct = Math.min(100, Math.round((value / block) * 100));
  
  let status = 'ok';
  let statusColor = 'var(--success)';
  let bgColor = '#dcfce7';
  let textColor = '#166534';
  
  if (value >= block) {
    status = 'blocked';
    statusColor = 'var(--error)';
    bgColor = '#fee2e2';
    textColor = '#991b1b';
  } else if (value >= warn) {
    status = 'warning';
    statusColor = 'var(--warning)';
    bgColor = '#fef3c7';
    textColor = '#92400e';
  }
  
  return (
    <div className="card">
      <div className="card-body">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: 'var(--text-secondary)'
            }}>
              Complexity Score
            </span>
            <span className={`badge ${status}`} style={{ 
              background: bgColor, 
              color: textColor,
              fontSize: '0.75rem'
            }}>
              {status.toUpperCase()}
            </span>
          </div>
          <span style={{ 
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: statusColor
          }}>
            {value.toFixed(1)}
          </span>
        </div>
        
        <div style={{ 
          height: '12px', 
          background: 'var(--bg-tertiary)', 
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          marginBottom: 'var(--space-3)'
        }}>
          <div style={{ 
            width: `${pct}%`, 
            height: '100%', 
            background: statusColor,
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Safe: &lt; {warn}</span>
          <span>Warning: ≥ {warn}</span>
          <span>Block: ≥ {block}</span>
        </div>
      </div>
    </div>
  );
}
