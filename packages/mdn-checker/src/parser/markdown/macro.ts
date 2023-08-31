import { visit } from "unist-util-visit";
import { parseExpression } from "@babel/parser";
import type { Plugin } from "unified";
import type { Point } from "unist";
import type { Literal, Root, Text, Macro } from "mdast";

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
        args: expr.arguments.map((arg) => {
          switch (arg.type) {
            case "StringLiteral":
            case "NumericLiteral":
            case "BooleanLiteral":
              return arg.value;
            default:
              throw new Error(
                `Macro argument must be a literal: {{${source}}}`,
              );
          }
        }),
        source,
      };
    case "Identifier":
      return {
        type: "macro",
        name: expr.name,
        args: [],
        source,
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
        source,
      };
  }
  throw new Error(
    `Macro must be either a call expression or an identifier: {{${source}}}`,
  );
}

const macro: Plugin = () => (tree) => {
  visit(tree as Root, "text", (node, index, parent) => {
    const texts: (Text | Macro)[] = [];
    const leadingTextStart = { point: node.position!.start, index: 0 };
    for (const match of node.value.matchAll(macroPattern)) {
      const leadingText = node.value.slice(
        leadingTextStart.index,
        match.indices![0]![0],
      );
      const leadingTextLines = leadingText.split("\n");
      const macroText = match[0]!;
      const macroTextLines = macroText.split("\n");
      // }...\n
      // ...\n
      // ..{{macro(\n
      // )}}...
      // ...
      // => leadingTextStart.point = (line = x, column = y, offset = z)
      // => leadingTextLines = ["...", "...", ".."]
      // => macroStartPoint = (line = x + 2, column = 3, offset = z + 10)
      // => macroTextLines = ["{{macro(", ")}}"]
      // => macroEndPoint = (line = x + 3, column = 4, offset = z + 10 + 12)
      const macroStartPoint = {
        line: leadingTextStart.point.line + leadingTextLines.length - 1,
        column:
          leadingTextLines.length > 1
            ? leadingTextLines.at(-1)!.length + 1
            : leadingTextStart.point.column + leadingText.length,
        offset: leadingTextStart.point.offset! + leadingText.length,
      } satisfies Point;
      const macroEndPoint = {
        line: macroStartPoint.line + macroTextLines.length - 1,
        column:
          macroTextLines.length > 1
            ? macroTextLines.at(-1)!.length + 1
            : macroStartPoint.column + macroText.length,
        offset: macroStartPoint.offset + macroText.length,
      } satisfies Point;
      if (leadingText) {
        texts.push({
          type: "text",
          value: leadingText,
          position: {
            start: leadingTextStart.point,
            end: macroStartPoint,
          },
        });
      }
      texts.push({
        ...parseMacro(match.groups!.content!),
        position: {
          start: macroStartPoint,
          end: macroEndPoint,
        },
      });
      leadingTextStart.index = match.indices![0]![1] + 1;
      leadingTextStart.point = {
        // TODO: I'm not sure if these two need to be shifted, but they are
        // currently not used
        line: macroEndPoint.line,
        column: macroEndPoint.column,
        offset: macroEndPoint.offset + 1,
      };
    }
    if (leadingTextStart.index < node.value.length) {
      texts.push({
        type: "text",
        value: node.value.slice(leadingTextStart.index),
        position: {
          start: leadingTextStart.point,
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
