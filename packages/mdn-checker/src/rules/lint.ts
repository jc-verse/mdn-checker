import { ESLint, type Linter } from "eslint";
import { parse as babelParse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { NodePath, types as t } from "@babel/core";
import { visit } from "unist-util-visit";
import type { Context } from "../context.js";

const configScript: Linter.Config = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script",
  },
  // Note: we virtually cannot enable any rule at the moment because the JS docs
  // demonstrates every kind of anti-pattern
  // We need a way to mark rules as disabled for certain blocks without
  // modifying the content
};

const configModule: Linter.Config = JSON.parse(JSON.stringify(configScript));
configModule.parserOptions!.sourceType = "module";

const eslintScript = new ESLint({
  useEslintrc: false,
  overrideConfig: configScript,
  fix: true,
});

const eslintModule = new ESLint({
  useEslintrc: false,
  overrideConfig: configModule,
  fix: true,
});

function looksLikeModule(source: string): boolean {
  try {
    // TODO do we need this double parsing? Can we lint the AST directly?
    // This is fine for now since code blocks are short anyway
    const file = babelParse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      annexB: true,
    });
    // This is going to fail the ESLint parser anyway.
    // We return true by default so that import/export still works, although
    // things like `with` do not
    if (file.errors.length > 0) return true;
    let isModule = false;
    let isInAsyncFunction = false;
    // The types are for v7
    (traverse as unknown as typeof traverse.default)(file, {
      ...Object.fromEntries(
        [
          "ImportDeclaration",
          "ExportNamedDeclaration",
          "ExportAllDeclaration",
          "ExportDefaultDeclaration",
          // eslint-disable-next-line no-void
        ].map((type) => [type, () => void (isModule = true)]),
      ),
      MetaProperty(path) {
        if (path.node.meta.name === "import") isModule = true;
      },
      ...Object.fromEntries(
        [
          "FunctionDeclaration",
          "FunctionExpression",
          "ArrowFunctionExpression",
        ].map((type) => [
          type,
          (
            path: NodePath<
              | t.FunctionDeclaration
              | t.FunctionExpression
              | t.ArrowFunctionExpression
            >,
          ) =>
            // eslint-disable-next-line no-void
            void (path.node.async && (isInAsyncFunction = true)),
        ]),
      ),
      ...Object.fromEntries(
        ["AwaitExpression", "ForAwaitStatement"].map((type) => [
          type,
          // eslint-disable-next-line no-void
          () => void (!isInAsyncFunction && (isModule = true)),
        ]),
      ),
    });
    return isModule;
  } catch (e) {
    // Probably a parsing error (e.g. Babel doesn't support HTML comments)
    // This is going to be reported by the ESLint parser
    return true;
  }
}

export default async function rule(context: Context): Promise<void> {
  const resPromises: Promise<readonly [ESLint.LintResult, number]>[] = [];
  visit(context.ast, "code", (node) => {
    if (node.lang !== "js") return;
    const segments = node.value.split(/(^\/\/ (?:OR|-- [^\n]+ --)$.*?)/imsu);
    let offset = 0;
    for (const segment of segments) {
      const eslint = looksLikeModule(segment) ? eslintModule : eslintScript;
      const offsetCopy = offset;
      const res = eslint
        .lintText(segment)
        .then(
          (res) => [res[0]!, node.position!.start.line + offsetCopy] as const,
        );
      resPromises.push(res);
      offset += segment.split("\n").length;
    }
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
