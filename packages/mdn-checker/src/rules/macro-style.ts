import { visit } from "unist-util-visit";
import * as Prettier from "prettier";
import { diffLines } from "diff";
import { color } from "../utils.js";
import type { FileContext } from "../context.js";

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

Object.defineProperty(rule, "name", { value: "macro-style" });

rule.appliesTo = () => "all";
