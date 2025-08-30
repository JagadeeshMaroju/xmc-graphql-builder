import { GraphQLSchema, GraphQLType, getNamedType, isListType, isNonNullType } from 'graphql';
export type ComplexityWeights = { baseField: number; listBonus: number; nestedBonus: number; perDepth: number; perArg: number; maxWarn: number; maxBlock: number };
export const DEFAULT_WEIGHTS: ComplexityWeights = { baseField: 1, listBonus: 2, nestedBonus: 1, perDepth: 1, perArg: 0.5, maxWarn: 120, maxBlock: 200 };
export type FieldInfo = { name: string; args: number; type: GraphQLType; hasChildren: boolean };
export function scoreField(_schema: GraphQLSchema, field: FieldInfo, depth: number, weights: ComplexityWeights = DEFAULT_WEIGHTS) {
  let s = weights.baseField; if (field.args) s += field.args * weights.perArg; let t: GraphQLType | null = field.type as any; while (isNonNullType(t)) t = (t as any).ofType; if (t && isListType(t)) s += weights.listBonus; if (field.hasChildren) s += weights.nestedBonus; s += depth * weights.perDepth; return s;
}
