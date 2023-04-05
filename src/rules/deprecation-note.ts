import type { Context } from "../index.js";

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

rule.appliesTo = (context: Context) =>
  context.frontMatter.status?.includes("deprecated");
