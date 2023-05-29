import { escapeRegExp, interpolate, printRegExp } from "../utils.js";
import inheritance from "../data/inheritance.js";
import { getIntrinsics, type JSConstructor } from "es-scraper";
import type { Content, Heading } from "mdast";
import type { Context } from "../context.js";

function isSyntaxHeading(node: Content): node is Heading {
  return (
    node.type === "heading" &&
    node.children[0]?.type === "text" &&
    node.children[0].value === "Syntax"
  );
}

const intrinsics = await getIntrinsics();

const notePatterns: Record<JSConstructor["usage"], string> = {
  equivalent: escapeRegExp(
    "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance.",
  ),
  construct: escapeRegExp(
    '`~ctor~()` can only be constructed with [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to call it without `new` throws a {{jsxref("TypeError")}}.',
  ),
  call: escapeRegExp(
    '`~ctor~()` can only be called without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to construct it with `new` throws a {{jsxref("TypeError")}}.',
  ),
  get none(): never {
    throw new Error("Abstract classes should not have constructor page");
  },
  set none(v: never) {
    throw new Error("Abstract classes should not have constructor page");
  },
  different: escapeRegExp`\`~ctor~()\` can be called with or without [\`new\`](/en-US/docs/Web/JavaScript/Reference/Operators/new), but ${"(?:sometimes )?"}with different effects. See [Return value](#return_value).`,
};

function selectNotePattern(ctor: string): string {
  if (["Intl.DateTimeFormat", "Intl.NumberFormat"].includes(ctor)) {
    return escapeRegExp(
      "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance. However, there's a special behavior when it's called without `new` and the `this` value is another `~ctor~` instance; see [Return value](#return_value).",
    );
  }
  if (ctor === "Intl.Collator") return notePatterns.equivalent;
  if (ctor.startsWith("Intl")) return notePatterns.construct;
  if (ctor === "InternalError") return notePatterns.equivalent;
  const target = intrinsics.find((o) => o.name === ctor);
  if (!target || target.type !== "class")
    throw new Error(`${ctor} is not a known global class`);
  return notePatterns[target.constructor!.usage];
}

const typedArrayCtors = Object.keys(inheritance).filter((k) =>
  inheritance[k]?.includes("TypedArray"),
);

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
  else if (
    !(
      syntaxSection[1].lang === "js-nolint" ||
      (context.path.includes("reference/regular_expressions") &&
        syntaxSection[1].lang === "regex")
    )
  )
    context.report("Syntax uses wrong language");
  if (context.frontMatter["page-type"] === "javascript-constructor") {
    const note = syntaxSection[2];
    if (!note || note.type !== "callout" || note.kind !== "Note") {
      context.report("Missing note about constructor");
    } else {
      const noteText = context.getSource(note.children[0]!);
      const ctor = context.frontMatter.title.replace("() constructor", "");
      const expectedNote = new RegExp(
        interpolate(selectNotePattern(ctor), { ctor }),
      );
      if (!expectedNote.test(noteText.trim())) {
        context.report(
          `Note about constructor is wrong. Should be: ${printRegExp(
            expectedNote,
          )}`,
        );
      }
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
      if (
        !["eval()", "Generator.prototype.throw()", "await"].includes(
          context.frontMatter.title,
        )
      )
        context.report("Exceptions section must be a single dl");
    } else if (
      section[0].children.some(
        (n) =>
          n.type === "dt" &&
          !/^\{\{jsxref\("(?:TypeError|RangeError|SyntaxError|ReferenceError|URIError)"\)\}\}$/u.test(
            context.getSource(n).trim(),
          ),
      )
    ) {
      context.report("Exceptions section must contain known errors");
    } else if (
      section[0].children.some(
        (n) =>
          n.type === "dd" &&
          !/^- : Thrown (?:in \[strict mode\]\(\/en-US\/docs\/Web\/JavaScript\/Reference\/Strict_mode\) )?if/u.test(
            context.getSource(n).trim(),
          ),
      )
    ) {
      context.report(
        "Exception description must start with 'Thrown if' or 'Thrown in strict mode if'",
      );
    }
  });
}

Object.defineProperty(rule, "name", { value: "syntax-section" });

rule.appliesTo = (context: Context) =>
  context.ast.children.some(isSyntaxHeading);
