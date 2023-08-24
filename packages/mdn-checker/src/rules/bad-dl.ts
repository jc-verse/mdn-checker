import { visit } from "unist-util-visit";
import type { FileContext } from "../context.js";

export default function rule(context: FileContext): void {
  visit(context.ast, "listItem", (node) => {
    const firstParagraph = node.children[0];
    if (firstParagraph?.type !== "paragraph") return;
    const firstText = firstParagraph.children[0];
    if (firstText?.type === "text" && firstText.value.startsWith(": "))
      context.report("Bad dl");
  });
}

Object.defineProperty(rule, "name", { value: "bad-dl" });

rule.appliesTo = () => "all";
