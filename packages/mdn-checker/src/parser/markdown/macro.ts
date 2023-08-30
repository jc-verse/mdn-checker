import { visit } from "unist-util-visit";
import { parseExpression } from "@babel/parser";
import type { Plugin } from "unified";
import type { Point } from "unist";
import type { Literal, Root, Text, Macro, MacroArg } from "mdast";

const macroPattern = /\{\{(?<content>(?:.(?!\}\}))*.)\}\}/dgsu;

function parseMacro(source: string): Macro {
  const expr = (() => {
    try {
      return parseExpression(source);
    } catch (e) {
      throw new Error(`Failed to parse macro: {{${source}}}`, { cause: e });
    }
  })();
  switch (expr.type) {
    case "CallExpression":
      if (expr.callee.type !== "Identifier")
        throw new Error(`Macro must be a valid identifier: {{${source}}}`);
      return {
        type: "macro",
        name: expr.callee.name,
        args: expr.arguments.map((arg): MacroArg => {
          switch (arg.type) {
            case "StringLiteral":
              return { value: arg.value, raw: arg.extra!.raw as string };
            case "NumericLiteral":
              return { value: arg.value, raw: arg.extra!.raw as string };
            case "BooleanLiteral":
              return { value: arg.value, raw: String(arg.value) };
            default:
              throw new Error(
                `Macro argument must be a literal: {{${source}}}`,
              );
          }
        }),
      };
    case "Identifier":
      return {
        type: "macro",
        name: expr.name,
        args: [],
      };
    case "BinaryExpression":
      // "non-standard_header"
      if (
        expr.operator !== "-" ||
        expr.left.type !== "Identifier" ||
        expr.right.type !== "Identifier"
      )
        break;
      return {
        type: "macro",
        name: `${expr.left.name}-${expr.right.name}`,
        args: [],
      };
  }
  throw new Error(
    `Macro must be either a call expression or an identifier: {{${source}}}`,
  );
}

const macro: Plugin = () => (tree) => {
  visit(tree as Root, "text", (node, index, parent) => {
    const texts: (Text | Macro)[] = [];
    let remainingText = node.value;
    let remainingTextStart = node.position!.start;
    for (const match of node.value.matchAll(macroPattern)) {
      const macroContent = parseMacro(match.groups!.content!);
      const textBefore = remainingText.slice(0, match.indices![0]![0]);
      const textBeforeLines = textBefore.split("\n");
      const macroText = match[0]!;
      const macroTextLines = macroText.split("\n");
      remainingText = remainingText.slice(match.indices![0]![1]);
      // ...\n
      // ...\n
      // ..{{macro(
      // )}}...
      // ...
      // => start = (line = x, column = y, offset = z)
      // => textBeforeLines = ["...", "...", ".."]
      // => macroStartBoundary = (line = x + 2, column = 3, offset = z + 10)
      // => macroTextLines = ["{{macro(", ")}}"]
      // => macroEndBoundary = (line = x + 3, column = 4, offset = z + 10 + 12)
      const macroStartBoundary = {
        line: remainingTextStart.line + textBeforeLines.length - 1,
        column:
          textBeforeLines.length > 1
            ? textBeforeLines.at(-1)!.length + 1
            : remainingTextStart.column + textBefore.length,
        offset: remainingTextStart.offset! + textBefore.length,
      } satisfies Point;
      const macroEndBoundary = {
        line: macroStartBoundary.line + macroTextLines.length - 1,
        column:
          macroTextLines.length > 1
            ? macroTextLines.at(-1)!.length + 1
            : macroStartBoundary.column + macroText.length,
        offset: macroStartBoundary.offset + macroText.length,
      } satisfies Point;
      remainingTextStart = macroEndBoundary;
      if (textBefore) {
        texts.push({
          type: "text",
          value: textBefore,
          position: {
            start: remainingTextStart,
            end: macroStartBoundary,
          },
        });
      }
      macroContent.position = {
        start: macroStartBoundary,
        end: macroEndBoundary,
      };
      texts.push(macroContent);
    }
    if (remainingText) {
      texts.push({
        type: "text",
        value: remainingText,
        position: {
          start: remainingTextStart,
          end: node.position!.end,
        },
      });
    }
    parent!.children.splice(index!, 1, ...texts);
  });

  function disallowMacro(nodeType: "inlineCode" | "code") {
    macroPattern.lastIndex = 0;
    visit(tree, nodeType, (node: Literal) => {
      const match = macroPattern.exec(node.value);
      if (match) {
        throw new Error(
          `Line ${node.position!.start.line}: macro ${
            match[0]
          } found in code block`,
        );
      }
    });
  }

  // Other things that extends Literal include YAML and HTML but the latter can
  // legitimately contain macros
  disallowMacro("inlineCode");
  disallowMacro("code");
  return tree;
};

export default macro;
