import { interpolate } from "../utils.js";
import type { Content, Heading } from "mdast";
import type { Context } from "../index.js";

function isSyntaxHeading(node: Content): node is Heading {
  return (
    node.type === "heading" &&
    node.children[0]?.type === "text" &&
    node.children[0].value === "Syntax"
  );
}

const notePatterns = [
  "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance.",
  '`~ctor~()` can only be constructed with [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to call it without `new` throws a {{jsxref("TypeError")}}.',
  '`~ctor~()` can only be called without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to construct it with `new` throws a {{jsxref("TypeError")}}.',
];

function selectNotePattern(ctor: string): string[] {
  if (["Boolean", "Number", "String", "Date"].includes(ctor)) {
    return [
      "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new), but with different effects. See [Return value](#return_value).",
    ];
  }
  if (["Intl.DateTimeFormat", "Intl.NumberFormat"].includes(ctor)) {
    return [
      "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance. However, there's a special behavior when it's called without `new` and the `this` value is another `~ctor~` instance; see [Return value](#return_value).",
    ];
  }
  if (ctor === "RegExp") {
    return [
      "`RegExp()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new), but sometimes with different effects. See [Return value](#return_value).",
    ];
  }
  if (ctor === "Object") {
    return [
      "`Object()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new object.",
    ];
  }
  return notePatterns;
}

export default function rule(context: Context): void {
  const syntaxHeading = context.ast.children.findIndex(isSyntaxHeading);
  const syntaxSection = context.ast.children
    .slice(
      syntaxHeading,
      context.ast.children.findIndex(
        (node, index) =>
          index > syntaxHeading && node.type === "heading" && node.depth === 2,
      ),
    )
    .filter((n) => n.type !== "html" || !n.value.startsWith("<!--"));
  if (syntaxSection[1]!.type !== "code") context.report("Missing syntax");
  else if (syntaxSection[1].lang !== "js-nolint")
    context.report("Syntax uses wrong language");
  if (context.frontMatter["page-type"] === "javascript-constructor") {
    const note = syntaxSection[2];
    if (!note || note.type !== "callout" || note.kind !== "Note") {
      context.report("Missing note about constructor");
    } else {
      const noteText = context.source.slice(
        note.children[0]!.position!.start.offset,
        note.children[0]!.position!.end.offset,
      );
      const ctor = context.frontMatter.title.replace("() constructor", "");
      const expectedNote = selectNotePattern(ctor).map((p) =>
        interpolate(p, { ctor }),
      );
      if (!expectedNote.includes(noteText.trim()))
        context.report("Note about constructor is wrong");
    }
  }
}

rule.appliesTo = (context: Context) =>
  context.ast.children.some(isSyntaxHeading);
