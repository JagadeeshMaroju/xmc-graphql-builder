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
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: '6px',
      border: '1px solid var(--border-light)',
      padding: '8px 12px',
      marginBottom: '12px'
    }}>
      {/* Header with title and score */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            Complexity
          </span>
          <span style={{ 
            background: bgColor, 
            color: textColor,
            fontSize: '0.65rem',
            fontWeight: '600',
            padding: '1px 4px',
            borderRadius: '3px',
            textTransform: 'uppercase'
          }}>
            {status}
          </span>
        </div>
        <span style={{ 
          fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: statusColor
        }}>
          {value.toFixed(1)}
        </span>
      </div>
      
      {/* Ultra-compact progress bar */}
      <div style={{ 
        height: '4px', 
        background: 'var(--bg-tertiary)', 
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ 
          width: `${pct}%`, 
          height: '100%', 
          background: statusColor,
          borderRadius: '2px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {/* Ultra-compact legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        marginTop: '4px'
      }}>
        <span>Safe: &lt; {warn}</span>
        <span>Warning: ≥ {warn}</span>
        <span>Block: ≥ {block}</span>
      </div>
    </div>
  );
}
