import { visit } from "unist-util-visit";
import * as Prettier from "prettier";
import { diffLines } from "diff";
import { color, slugToFilePath } from "../utils.js";
import type { FileContext, ExitContext } from "../context.js";

const macroCount = new Map<string, number>();

export default async function rule(context: FileContext): Promise<void> {
  const checks: Promise<[string, string] | undefined>[] = [];
  visit(context.ast, "macro", (node) => {
    if (!macroCount.has(node.name)) macroCount.set(node.name, 0);
    macroCount.set(node.name, macroCount.get(node.name)! + 1);
    const macroSource = context.getSource(node);
    // If (!/^\{\{\w.*[\w)]\}\}$/u.test(macroSource))
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
    if (node.name.toLowerCase() === "jsxref") {
      switch (node.args.length) {
        case 4:
        // TODO: enforce the 4th is a boolean
        // Fallthrough
        case 3:
          if (typeof node.args[2] !== "string") {
            context.report(`Expected string for 2nd param: ${macroSource}`);
            return;
          }
        // Fallthrough
        case 2:
          if (typeof node.args[1] !== "string") {
            context.report(`Expected string for 1st param: ${macroSource}`);
            return;
          }
        // Fallthrough
        case 1:
          if (typeof node.args[0] !== "string") {
            context.report(`Expected string for 0th param: ${macroSource}`);
            return;
          }
          break;
        default:
          context.report(`Expected 1-4 params: ${macroSource}`);
          return;
      }
      const args = node.args as [
        string,
        string?,
        string?,
        (string | boolean | number)?,
      ];
      const [link, linkText] = args;
      switch (args.length) {
        case 2:
          // Check for inferrable slugs
          if (
            // TODO these should probably be fixed in Yari
            // Can't infer non-global-objects
            !["Operators", "Functions"].some((x) => link.startsWith(x)) &&
            // Can't infer constructors
            // eslint-disable-next-line prefer-named-capture-group
            !/(\w+)\/\1$/u.test(link) &&
            // Can't infer Intl methods (because jsxref only replaces one dot!)
            !(link.startsWith("Intl") && link.split("/").length > 2) &&
            // Can't infer eval() (because it redirects)
            link !== "Global_Objects/eval"
          ) {
            const dottedPath = link.replaceAll("/", ".");
            const inferrableTargets = [
              dottedPath,
              dottedPath.split(".").toSpliced(-2, 0, "prototype").join("."),
            ];
            if (
              inferrableTargets.some(
                (x) => linkText === x || linkText === `${x}()`,
              )
            )
              context.report(`Inferrable link target: ${macroSource}`);
          }
        // Fallthrough
        case 3:
        case 4:
          // Check slug validity
          if (/Global_Objects(?!\/eval)/u.test(link)) {
            context.report(`Unnecessary Global_Objects prefix: ${macroSource}`);
          } else {
            const targetsToTry = [
              `reference/${link}`,
              `reference/global_objects/${link}`,
            ].map(slugToFilePath);
            if (targetsToTry.every((l) => context.getFile(l) === undefined))
              context.report(`URL target is not a valid link: ${macroSource}`);
          }
      }
    }
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
