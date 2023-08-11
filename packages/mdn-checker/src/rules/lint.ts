import { ESLint, type Linter } from "eslint";
import { visit } from "unist-util-visit";
import type { Context } from "../context.js";

const config: Linter.Config = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  // Note: we virtually cannot enable any rule at the moment because the JS docs
  // demonstrates every kind of anti-pattern
  // We need a way to mark rules as disabled for certain blocks without
  // modifying the content
};

const eslint = new ESLint({
  useEslintrc: false,
  overrideConfig: config,
  fix: true,
});

export default async function rule(context: Context): Promise<void> {
  const resPromises: Promise<readonly [ESLint.LintResult, number]>[] = [];
  visit(context.ast, "code", (node) => {
    if (node.lang !== "js") return;
    const res = eslint
      .lintText(node.value)
      .then((res) => [res[0]!, node.position!.start.line] as const);
    resPromises.push(res);
  });
  await Promise.all(resPromises).then((results) => {
    for (const [result, codeBlockLine] of results) {
      for (const message of result.messages) {
        context.report(
          `${message.line + codeBlockLine}:${message.column}: [${
            message.ruleId ?? "Parsing error"
          }] ${message.message.replace(/^Parsing error: /, "")}`,
        );
      }
    }
  });
}

Object.defineProperty(rule, "name", { value: "lint" });

rule.appliesTo = () => "all";
