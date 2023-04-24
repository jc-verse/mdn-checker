import { toString } from "mdast-util-to-string";
import type { Node } from "unist";

export function toText(node: Node): string {
  return toString(node).replace(
    /\{\{jsxref\((?:"[^'"]+", )?"(?<name>[^'"]+)"\)\}\}/g,
    "$<name>",
  );
}
