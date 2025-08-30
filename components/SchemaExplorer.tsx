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
    <div>
      <h3>Schema Explorer</h3>
      <input placeholder="Search types & fields…" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%' }} />
      <div style={{ marginTop: 8, maxHeight: 260, overflow: 'auto', border: '1px solid #eee' }}>
        {items.map(i => (
          <details key={i.name} style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
            <summary><span style={{ fontFamily: 'monospace' }}>{i.name}</span><em style={{ color: '#999', marginLeft: 6 }}>({i.kind})</em></summary>
            {i.desc && <p style={{ color: '#666', margin: '4px 0 8px' }}>{i.desc}</p>}
            {i.fields && (
              <ul style={{ listStyle: 'none', paddingLeft: 12 }}>
                {i.fields.map(f => (
                  <li key={f.name} style={{ marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace' }}>{f.name}</span>
                    {f.description && <em style={{ color: '#888', marginLeft: 6 }}>{f.description}</em>}
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
