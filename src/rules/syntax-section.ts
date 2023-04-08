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

const typedArrayCtors = [
  "BigInt64Array",
  "BigUint64Array",
  "Float32Array",
  "Float64Array",
  "Int16Array",
  "Int32Array",
  "Int8Array",
  "Uint16Array",
  "Uint32Array",
  "Uint8Array",
  "Uint8ClampedArray",
];

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
      const noteText = context.getSource(note.children[0]!);
      const ctor = context.frontMatter.title.replace("() constructor", "");
      const expectedNote = selectNotePattern(ctor).map((p) =>
        interpolate(p, { ctor }),
      );
      if (!expectedNote.includes(noteText.trim()))
        context.report("Note about constructor is wrong");
    }
  }
  const subheadings = Object.fromEntries(
    syntaxSection
      .map((n, i) => [n, i] as const)
      .filter(
        (p): p is [Heading, number] =>
          p[0].type === "heading" && p[0].depth === 3,
      )
      .map(
        ([
          {
            children: [content],
          },
          i,
        ]) => [content?.type === "text" ? content.value : "", i] as const,
      ),
  );
  function checkSubsection(
    sectionName: string,
    checker: (section: Content[]) => void,
  ) {
    const index = subheadings[sectionName];
    if (index && index > 0) {
      const section = syntaxSection.slice(
        index + 1,
        Object.values(subheadings)[
          Object.keys(subheadings).indexOf(sectionName) + 1
        ],
      );
      checker(section);
    }
  }
  // CheckSubsection("Return value", (section) => {
  //   if (section.some((n) => !["callout", "paragraph", "dl"].includes(n.type)))
  //   console.log(context.path);
  // });
  checkSubsection("Exceptions", (section) => {
    if (
      typedArrayCtors.includes(
        context.frontMatter.title.replace("() constructor", ""),
      )
    ) {
      if (
        section.length !== 1 ||
        context.getSource(section[0]!).trim() !==
          "See [`TypedArray`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#exceptions)."
      )
        context.report("TypedArray Exceptions incorrect");
    } else if (section.length !== 1 || section[0]!.type !== "dl") {
      context.report("Exceptions section must be a single dl");
    } else if (
      section[0].children.some(
        (n) =>
          n.type === "dt" &&
          !/^\{\{jsxref\("(?:TypeError|RangeError|SyntaxError|ReferenceError|URIError)"\)}}$/.test(
            context.getSource(n).trim(),
          ),
      )
    ) {
      context.report("Exceptions section must contain known errors");
    } else if (
      section[0].children.some(
        (n) =>
          n.type === "dd" &&
          !context.getSource(n).trim().startsWith("- : Thrown if"),
      )
    ) {
      context.report("Exception description must start with 'Thrown if'");
    }
  });
}

rule.appliesTo = (context: Context) =>
  context.ast.children.some(isSyntaxHeading);
