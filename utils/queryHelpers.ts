import { Selection } from "@/lib/graphql/ast";

// Gather values the user typed into field-argument inputs in the selection tree
export function collectValuesFromSelections(
  selections: Selection[],
  acc: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const sel of selections) {
    if (sel.args && sel.args.length) {
      for (const a of sel.args) {
        if (a.value !== undefined && a.value !== null && a.value !== "") {
          acc[a.name] = a.value as any;
        }
      }
    }
    if (sel.children && sel.children.length) {
      collectValuesFromSelections(sel.children, acc);
    }
  }
  return acc;
}
