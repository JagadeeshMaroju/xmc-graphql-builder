import { buildClientSchema, GraphQLSchema, GraphQLType, getNamedType, isObjectType, isInterfaceType, isUnionType, isListType, isNonNullType, GraphQLInputType } from 'graphql';
export function buildSchemaFromIntrospection(introspectionData: any): GraphQLSchema { return buildClientSchema(introspectionData); }
export function unwrapNamed(type: GraphQLType) { return getNamedType(type); }
export function isComposite(t: GraphQLType) { const nt = getNamedType(t); return isObjectType(nt) || isInterfaceType(nt) || isUnionType(nt); }
export function typeLabel(t: GraphQLType): string { let label = ''; let cur: any = t; while (cur) { if (isNonNullType(cur)) { label += '!'; cur = cur.ofType; continue; } if (isListType(cur)) { label = `[${label || typeLabel(cur.ofType)}]`; return label; } break; } return (getNamedType(t) as any).name + label; }
export function isInputScalar(t: GraphQLInputType): boolean { const name = (getNamedType(t) as any).name; return ['String','ID','Int','Float','Boolean','DateTime'].includes(name); }
