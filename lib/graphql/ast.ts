import {
  DocumentNode,
  OperationDefinitionNode,
  SelectionSetNode,
  FieldNode,
  Kind,
  print,
  ArgumentNode,
  VariableDefinitionNode,
  NamedTypeNode,
  VariableNode,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLType,
  GraphQLInputType,
  GraphQLField,
  GraphQLArgument,
  getNamedType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isListType,
  isNonNullType,
  OperationTypeNode,
} from "graphql";
import type { ValueNode } from "graphql";
// add `literal?: boolean` so some args can be printed as inline literals
export type ArgSpec = {
  name: string;
  type: GraphQLInputType;
  value?: unknown;

  // NEW:
  literal?: boolean; // if true, print value inline instead of $variable
  varName?: string; // optional override for variable name (e.g. "pageSize" for "first")
};

export type Selection = {
  field: string;
  args?: ArgSpec[];
  children?: Selection[];
  typeCondition?: string;
};

export function buildOperation(
  rootType: "query" | "mutation",
  rootField: string,
  children: Selection[],
  variableDefs: VariableDefinitionNode[] = []
): DocumentNode {
  const rootNode = children.find((c) => c.field === rootField);
  const rootArgs = rootNode?.args ?? [];
  const rootChildren = rootNode?.children ?? children;
  const op: OperationDefinitionNode = {
    kind: Kind.OPERATION_DEFINITION,
    operation: rootType as OperationTypeNode,
    name: { kind: Kind.NAME, value: "AutoQuery" },
    variableDefinitions: variableDefs,
    selectionSet: {
      kind: Kind.SELECTION_SET,
      selections: [
        {
          kind: Kind.FIELD,
          name: { kind: Kind.NAME, value: rootField },
          arguments: toArgs(rootArgs),
          selectionSet: buildSelectionSet(rootChildren),
        },
      ],
    },
  };
  return { kind: Kind.DOCUMENT, definitions: [op] };
}

function buildSelectionSet(
  selections?: Selection[]
): SelectionSetNode | undefined {
  if (!selections || !selections.length) return undefined;

  const nodes = selections.flatMap((sel) => {
    // Inline fragment – only emit if it has children
    if (sel.typeCondition) {
      const child = buildSelectionSet(sel.children);
      if (!child || !child.selections.length) return []; // <-- prune empty fragment
      return [
        {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: {
            kind: Kind.NAMED_TYPE,
            name: { kind: Kind.NAME, value: sel.typeCondition },
          },
          selectionSet: child,
        } as any,
      ];
    }

    // Field
    const selectionSet = buildSelectionSet(sel.children);
    const node: FieldNode = {
      kind: Kind.FIELD,
      name: { kind: Kind.NAME, value: sel.field },
      arguments: toArgs(sel.args ?? []),
      // For non-leaf fields with no children, GraphQL still needs at least one subfield;
      // leaving selectionSet undefined is OK if the field is a leaf; otherwise users should pick children.
      selectionSet,
    };
    return [node];
  });

  // If everything got pruned, return undefined
  return nodes.length
    ? { kind: Kind.SELECTION_SET, selections: nodes as any }
    : undefined;
}

// lib/graphql/ast.ts (replace toArgs)
function toArgs(args: ArgSpec[]): ArgumentNode[] | undefined {
  if (!args || !args.length) return undefined;
  return args.map((a) => ({
    kind: Kind.ARGUMENT,
    name: { kind: Kind.NAME, value: a.name },
    value: a.literal
      ? buildValueNode(a.value)
      : variableRef(a.varName || a.name),
  }));
}

export function variableRef(name: string): VariableNode {
  return { kind: Kind.VARIABLE, name: { kind: Kind.NAME, value: name } };
}
export function makeVarDef(
  name: string,
  typeNode: NamedTypeNode,
  isNonNull = false
): VariableDefinitionNode {
  const t = isNonNull ? { kind: Kind.NON_NULL_TYPE, type: typeNode } : typeNode;
  return {
    kind: Kind.VARIABLE_DEFINITION,
    variable: { kind: Kind.VARIABLE, name: { kind: Kind.NAME, value: name } },
    type: t as any,
  };
}
export function printDoc(doc: DocumentNode): string {
  return print(doc);
}
export function rootQueryType(schema: GraphQLSchema): GraphQLObjectType {
  const q = schema.getQueryType();
  if (!q) throw new Error("Schema has no Query type");
  return q;
}

// lib/graphql/ast.ts (replace collectVariablesFromSelections)
type VarMap = Map<string, { type: GraphQLInputType; nonNull: boolean }>;
export function collectVariablesFromSelections(
  schema: GraphQLSchema,
  parentType: GraphQLType | GraphQLObjectType,
  selections: Selection[],
  varMap: VarMap = new Map()
): VarMap {
  const namedParent =
    isObjectType(parentType as any) ||
    isInterfaceType(parentType as any) ||
    isUnionType(parentType as any)
      ? (parentType as any)
      : getNamedType(parentType as GraphQLType);

  if (isUnionType(namedParent) || isInterfaceType(namedParent)) {
    const possibles = isUnionType(namedParent)
      ? namedParent.getTypes()
      : schema.getPossibleTypes(namedParent);
    selections
      .filter((s) => s.typeCondition)
      .forEach((inline) => {
        const t = possibles.find((p) => p.name === inline.typeCondition);
        if (t)
          collectVariablesFromSelections(
            schema,
            t,
            inline.children ?? [],
            varMap
          );
      });
    return varMap;
  }

  if (!isObjectType(namedParent)) return varMap;

  for (const sel of selections) {
    if (sel.args && sel.args.length) {
      for (const a of sel.args) {
        if (a.literal) continue; // <<<< IMPORTANT: do not create variables for literal args
        const key = a.varName || a.name; // support custom var name
        const existing = varMap.get(key);
        if (!existing)
          varMap.set(key, { type: a.type, nonNull: isNonNullType(a.type) });
        else if (isNonNullType(a.type)) existing.nonNull = true;
      }
    }
    const field: GraphQLField<any, any> | undefined =
      namedParent.getFields?.()[sel.field];
    if (!field) continue;
    const nextType = getNamedType(field.type);
    if (sel.children && sel.children.length)
      collectVariablesFromSelections(schema, nextType, sel.children, varMap);
  }
  return varMap;
}

export function toNamedTypeNode(inputType: GraphQLInputType): NamedTypeNode {
  let t: any = inputType;
  while (isNonNullType(t) || isListType(t)) t = t.ofType;
  return {
    kind: Kind.NAMED_TYPE,
    name: { kind: Kind.NAME, value: (t as any)?.name },
  };
}
export function mergeRootArgsIntoSelections(
  rootFieldName: string,
  rootArgs: Record<string, unknown>,
  selections: Selection[],
  rootArgTypes: readonly GraphQLArgument[] | undefined
): Selection[] {
  const args = Object.entries(rootArgs).map(([name, value]) => {
    const type = rootArgTypes?.find((a) => a.name === name)?.type as
      | GraphQLInputType
      | undefined;
    return { name, value, type: type ?? (null as any) };
  });
  return [{ field: rootFieldName, args, children: selections }];
}

// Optional: use this to mark enum values in UI code (operator: asEnum('CONTAINS'))
// lib/graphql/ast.ts (helpers, place near variableRef/makeVarDef)
export function asEnum(name: string) {
  return { __enum: name } as const;
}

export function buildValueNode(value: any): ValueNode {
  if (value && typeof value === "object" && "__enum" in value) {
    return { kind: Kind.ENUM, value: String((value as any).__enum) };
  }
  if (value === null || value === undefined) return { kind: Kind.NULL };
  if (typeof value === "string") return { kind: Kind.STRING, value };
  if (typeof value === "boolean") return { kind: Kind.BOOLEAN, value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { kind: Kind.INT, value: String(value) }
      : { kind: Kind.FLOAT, value: String(value) };
  }
  if (Array.isArray(value)) {
    return { kind: Kind.LIST, values: value.map((v) => buildValueNode(v)) };
  }
  return {
    kind: Kind.OBJECT,
    fields: Object.entries(value).map(([k, v]) => ({
      kind: Kind.OBJECT_FIELD,
      name: { kind: Kind.NAME, value: k },
      value: buildValueNode(v),
    })),
  };
}
