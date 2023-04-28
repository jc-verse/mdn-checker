import type { Context } from "../context.js";

export default function rule(context: Context): void {
  if (!/^.*\{\{Deprecated_Header}}/i.test(context.source))
    context.report("No deprecated header");

  for (const node of context.ast.children) {
    if (node.type === "heading") {
      context.report("No replacement note");
      break;
    } else if (node.type === "callout" && node.kind === "Note") {
      break;
    }
  }
}

Object.defineProperty(rule, "name", { value: "deprecation-note" });

rule.appliesTo = (context: Context) =>
  context.frontMatter.status?.includes("deprecated") &&
  // These pages have the note incorporated in the intro
  !["Date.prototype.getYear()", "Date.prototype.setYear()"].includes(
    context.frontMatter.title,
  );
