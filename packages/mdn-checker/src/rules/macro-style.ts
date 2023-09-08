import { visit } from "unist-util-visit";
import * as Prettier from "prettier";
import { diffLines } from "diff";
import { color } from "../utils.js";
import type { FileContext, ExitContext } from "../context.js";

const macroCount = new Map<string, number>();

export default async function rule(context: FileContext): Promise<void> {
  const checks: Promise<[string, string] | undefined>[] = [];
  visit(context.ast, "macro", (node) => {
    // Const macroSource = context.getSource(node);
    // if (!/^\{\{\w.*[\w)]\}\}$/u.test(macroSource))
    //   context.report(`Macro ${macroSource} has extra whitespace around braces`);
    checks.push(
      Prettier.format(node.source, {
        printWidth: Infinity,
        parser: "babel",
        semi: false,
      }).then((formatted) =>
        formatted.trim() === node.source ||
        /non-standard_(?:inline|header)/iu.test(node.name)
          ? undefined
          : [node.source, formatted.trim()],
      ),
    );
    if (!macroCount.has(node.name)) macroCount.set(node.name, 0);
    macroCount.set(node.name, macroCount.get(node.name)! + 1);
  });
  await Promise.all(checks).then((res) =>
    (res.filter(Boolean) as [string, string][]).forEach(
      ([source, formatted]) => {
        const diff = diffLines(source, formatted);
        if (!diff.some((part) => part.added || part.removed)) return;
        let report = "";
        diff.forEach((part) => {
          report += color(
            part.added ? "green" : part.removed ? "red" : "default",
            `${part.value}\n`,
          );
        });
        context.report(report);
      },
    ),
  );
}

rule.onExit = (context: ExitContext) => {
  context.report(
    `Macro count:
${[...macroCount.entries().map(([name, count]) => `- ${name}: ${count}`)]
  .sort(new Intl.Collator("en-US", { sensitivity: "base" }).compare)
  .join("\n")}`,
  );
};

Object.defineProperty(rule, "name", { value: "macro-style" });

rule.appliesTo = () => "all";
