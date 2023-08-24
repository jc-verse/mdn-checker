import type { FileContext } from "../context.js";

export default function rule(context: FileContext): void {
  if (!/^.*\{\{Deprecated_Header\}\}/imu.test(context.source))
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

rule.appliesTo = (context: FileContext) =>
  context.frontMatter.status?.includes("deprecated") &&
  // These pages have the note incorporated in the intro
  !["Date.prototype.getYear()", "Date.prototype.setYear()"].includes(
    context.frontMatter.title,
  );
