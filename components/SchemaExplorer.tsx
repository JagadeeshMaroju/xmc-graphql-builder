'use client';
import { useMemo, useState } from 'react';
import type { GraphQLSchema, GraphQLNamedType, GraphQLField } from 'graphql';
import { isObjectType, isInterfaceType, isUnionType } from 'graphql';
export default function SchemaExplorer({ schema }: { schema: GraphQLSchema }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const list: { kind: string; name: string; desc?: string; fields?: GraphQLField<any, any>[] }[] = [];
    const typeMap = schema.getTypeMap();
    for (const [name, t] of Object.entries(typeMap)) {
      if (name.startsWith('__')) continue;
      if (isObjectType(t) || isInterfaceType(t)) {
        list.push({ kind: isObjectType(t) ? 'Object' : 'Interface', name, desc: (t as any).description, fields: Object.values(t.getFields()) });
      } else if (isUnionType(t)) {
        list.push({ kind: 'Union', name, desc: (t as any).description });
      } else {
        list.push({ kind: (t as GraphQLNamedType).constructor.name.replace('GraphQL', ''), name, desc: (t as any).description });
      }
    }
    const lower = q.trim().toLowerCase();
    if (!lower) return list.sort((a,b)=>a.name.localeCompare(b.name));
    return list.filter(i => i.name.toLowerCase().includes(lower) || (i.desc && i.desc.toLowerCase().includes(lower)) || (i.fields && i.fields.some(f => f.name.toLowerCase().includes(lower))));
  }, [schema, q]);
  return (
    <div className="schema-explorer">
      <h3 className="schema-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
        </svg>
        Schema Explorer
      </h3>
      <input 
        className="schema-search"
        placeholder="Search types & fields..." 
        value={q} 
        onChange={e => setQ(e.target.value)} 
      />
      <div className="schema-list">
        {items.map(i => (
          <details key={i.name} className="schema-item">
            <summary className="schema-summary">
              <svg className="schema-arrow" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              <span className="schema-name">{i.name}</span>
              <em className="schema-type">({i.kind})</em>
            </summary>
            {i.desc && <p className="schema-description">{i.desc}</p>}
            {i.fields && (
              <ul className="schema-fields">
                {i.fields.map(f => (
                  <li key={f.name} className="schema-field">
                    <span className="schema-field-name">{f.name}</span>
                    {f.description && <em className="schema-field-desc">{f.description}</em>}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
