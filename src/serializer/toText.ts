import { toString } from "mdast-util-to-string";

export function toText(node: Node): string {
  return toString(node).replace(
    /\{\{jsxref\((?:"[^'"]+", )?"(?<name>[^'"]+)"\)\}\}/g,
    "$<name>",
  );
}
