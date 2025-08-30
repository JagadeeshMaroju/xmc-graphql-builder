import { GraphQLSchema } from 'graphql';
import { rootQueryType } from '@/lib/graphql/ast';

export function RootFieldList({ schema, selected, onSelect }:{ schema: GraphQLSchema; selected: string | null; onSelect: (n: string) => void; }){
  const fields = Object.values(rootQueryType(schema).getFields());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {fields.map((f)=>(
        <label 
          key={f.name}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '6px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            border: selected === f.name ? '2px solid var(--primary)' : '2px solid transparent',
            background: selected === f.name ? 'var(--primary-light)' : 'transparent',
            margin: 0,
            minHeight: '32px',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            if (selected !== f.name) {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }
          }}
          onMouseLeave={(e) => {
            if (selected !== f.name) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <input 
            type="radio" 
            name="root" 
            checked={selected === f.name} 
            onChange={() => onSelect(f.name)}
            style={{ 
              margin: 0,
              accentColor: 'var(--primary)',
              transform: 'scale(1)',
              flexShrink: 0,
              width: '16px',
              height: '16px'
            }}
          />
          <span style={{ 
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
            fontSize: '0.875rem',
            fontWeight: selected === f.name ? '600' : '500',
            color: selected === f.name ? 'var(--primary)' : 'var(--text-primary)',
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {f.name}
          </span>
        </label>
      ))}
    </div>
  );
}
