import { visit } from "unist-util-visit";
import type { Context } from "../index.js";

export default function rule(context: Context): void {
  visit(context.ast, "listItem", (node) => {
    const firstParagraph = node.children[0];
    if (firstParagraph?.type !== "paragraph") return;
    const firstText = firstParagraph.children[0];
    if (firstText?.type === "text" && firstText.value.startsWith(": "))
      context.report("Bad dl");
  });
}

rule.appliesTo = () => "all";
