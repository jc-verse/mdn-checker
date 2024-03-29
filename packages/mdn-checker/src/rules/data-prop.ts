import type { FileContext } from "../context.js";

export default function rule(context: FileContext): void {
  const valueSection = context.tree.getSubsection("Value")?.ast;
  // Absence of Value section is reported by the heading rule
  if (!valueSection) return;
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
    !/\{\{js_property_attributes\([01], 0, [01]\)\}\}/u.test(
      context.getSource(valueSection[1]!),
    )
  ) {
    context.report("Value section must end in attributes table");
  }
}

Object.defineProperty(rule, "name", { value: "data-prop" });

rule.appliesTo = (context: FileContext) =>
  context.frontMatter["page-type"].endsWith("data-property");
