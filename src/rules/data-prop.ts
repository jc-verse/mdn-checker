import type { Content, Heading } from "mdast";
import type { Context } from "../index.js";

function isValueHeading(node: Content): node is Heading {
  return (
    node.type === "heading" &&
    node.children[0]?.type === "text" &&
    node.children[0].value === "Value"
  );
}

export default function rule(context: Context): void {
  const valueHeading = context.ast.children.findIndex(isValueHeading);
  const valueSection = context.ast.children.slice(
    valueHeading + 1,
    context.ast.children.findIndex(
      (node, index) =>
        index > valueHeading && node.type === "heading" && node.depth === 2,
    ),
  );
  if (
    ![2, 3].includes(valueSection.length) ||
    valueSection[0]!.type !== "paragraph" ||
    valueSection[1]!.type !== "paragraph" ||
    (valueSection[2] &&
      (valueSection[2].type !== "callout" || valueSection[2].kind !== "Note"))
  ) {
    if (
      !["Error.prototype.stack", "Function: displayName"].includes(
        context.frontMatter.title,
      )
    )
      context.report("Unrecognized value section format");
  } else if (
    !/\{\{js_property_attributes\([01], 0, [01]\)}}/.test(
      context.getSource(valueSection[1]!),
    )
  ) {
    context.report("Value section must end in attributes table");
  }
}

Object.defineProperty(rule, "name", { value: "data-prop" });

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].endsWith("data-property") &&
  // Absence of Value section is reported by the heading rule
  context.ast.children.some(isValueHeading);
