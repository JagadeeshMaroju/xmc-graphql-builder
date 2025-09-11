import { GraphQLSchema } from 'graphql';
import { rootQueryType } from '@/lib/graphql/ast';

export function RootFieldList({ schema, selected, onSelect }:{ schema: GraphQLSchema; selected: string | null; onSelect: (n: string) => void; }){
  const fields = Object.values(rootQueryType(schema).getFields());
  return (
    <div className="root-field-list">
      <h3 className="root-field-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
        </svg>
        Root Fields
      </h3>
      <div className="root-field-container">
        {fields.map((f)=>(
          <label 
            key={f.name}
            className={`root-field-label ${selected === f.name ? 'selected' : ''}`}
            onMouseEnter={(e) => {
              if (selected !== f.name) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== f.name) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <input 
              type="radio" 
              name="root" 
              checked={selected === f.name} 
              onChange={() => onSelect(f.name)}
              className="root-field-radio"
            />
            <span className={`root-field-text ${selected === f.name ? 'selected' : ''}`}>
              {f.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
