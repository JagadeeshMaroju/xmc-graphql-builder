import type { GraphQLSchema, GraphQLField } from "graphql";
import { getNamedType } from "graphql";
import { scoreField } from "@/lib/graphql/complexity";
import { Selection } from "@/lib/graphql/ast";

export function computeComplexity(
  schema: GraphQLSchema,
  rootField: GraphQLField<any, any>,
  selections: Selection[]
): number {
  const rootType = getNamedType(rootField.type);
  return walk(schema, rootType, selections, 0);
  
  function walk(
    sch: GraphQLSchema,
    parentType: any,
    sels: Selection[],
    depth: number
  ): number {
    let total = 0;
    const isUnion = !!(parentType as any).getTypes;
    const isInterface = !!(
      (sch as any).getPossibleTypes && (parentType as any).resolveType
    );
    if (isUnion || isInterface) {
      const children = sels.filter((s) => s.typeCondition);
      const possible = isUnion
        ? (parentType as any).getTypes()
        : (sch as any).getPossibleTypes(parentType);
      for (const c of children) {
        const t = possible.find((p: any) => p.name === c.typeCondition);
        if (t) total += walk(sch, t, c.children ?? [], depth + 1);
      }
      return total;
    }
    for (const sel of sels) {
      if (sel.typeCondition) continue;
      const f = parentType.getFields?.()[sel.field];
      if (!f) continue;
      const next = getNamedType(f.type);
      const info = {
        name: sel.field,
        args: sel.args?.length ?? 0,
        type: f.type,
        hasChildren: !!(sel.children && sel.children.length),
      } as any;
      total += scoreField(sch, info, depth);
      if (sel.children && sel.children.length)
        total += walk(sch, next, sel.children, depth + 1);
    }
    return total;
  }
}
