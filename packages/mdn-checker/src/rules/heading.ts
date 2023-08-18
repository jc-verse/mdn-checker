import { editingSteps } from "../utils.js";
import type { Context } from "../context.js";
import type { FrontMatter } from "../parser/front-matter.js";

const headingSequence = {
  "javascript-class": [
    "Description",
    "Constructor",
    "Static properties",
    "Static methods",
    "Instance properties",
    "Instance methods",
  ],
  "javascript-constructor": ["Syntax", "Description"],
  "javascript-instance-method": ["Syntax", "Description"],
  "javascript-instance-data-property": ["Value", "Description"],
  "javascript-instance-accessor-property": ["Syntax", "Description"],
  "javascript-static-method": ["Syntax", "Description"],
  "javascript-static-data-property": ["Value", "Description"],
  "javascript-static-accessor-property": ["Syntax", "Description"],
  "javascript-global-property": ["Value", "Description"],
  "javascript-function": ["Syntax", "Description"],
  "javascript-namespace": [
    "Description",
    "Static properties",
    "Static methods",
  ],
  "javascript-operator": ["Syntax", "Description"],
  "javascript-statement": ["Syntax", "Description"],
  "javascript-language-feature": ["Syntax", "Description"],
  "javascript-error": ["Message", "Error type", "What went wrong?"],
} satisfies Record<
  Extract<FrontMatter["page-type"], `javascript-${string}`>,
  string[]
> as Record<FrontMatter["page-type"], string[]>;

Object.entries(headingSequence).forEach(([k, sequence]) => {
  if (k === "javascript-error") {
    sequence.push("Examples", "See also");
  } else {
    sequence.push(
      "Examples",
      "Specifications",
      "Browser compatibility",
      "See also",
    );
  }
});

function checkHeadingSequence(
  headings: string[],
  expected: string[],
  context: Context,
  headingIsOptional: (heading: string) => boolean,
) {
  const edits = editingSteps(headings, expected).filter(
    (e) => !(e[0] === "i" && headingIsOptional(e[1])),
  );
  if (edits.length) {
    context.report(
      `Wrong heading sequence:
- ${edits
        .map(
          (e) =>
            ({
              d: `extra "${e[1]}"`,
              i: `missing "${e[1]}"`,
              s: `"${e[1]}" should be "${e[2]}"`,
            }[e[0]]),
        )
        .join("\n- ")}`,
    );
  }
}

const optionalTopHeadings = [
  "Description",
  "Constructor",
  "Static properties",
  "Static methods",
  "Instance properties",
  "Instance methods",
  "Exceptions",
];

export default function rule(context: Context): void {
  const topHeadings = Array.from(context.tree, (section) => section.title);
  let expectedTexts = headingSequence[context.frontMatter["page-type"]];
  if (context.frontMatter.title === "The arguments object") {
    // Don't mutate — this is shared globally
    expectedTexts = expectedTexts.toSpliced(
      expectedTexts.indexOf("Examples"),
      0,
      "Properties",
    );
  }
  checkHeadingSequence(
    topHeadings,
    expectedTexts,
    context,
    (heading: string) => {
      if (
        context.frontMatter["page-type"].endsWith("accessor-property") &&
        !context.frontMatter.title.includes("@@") &&
        heading === "Syntax"
      )
        return true;
      return optionalTopHeadings.includes(heading);
    },
  );
  const syntaxSection = context.tree.getSubsection("Syntax");
  if (syntaxSection) {
    const syntaxHeadings = Array.from(syntaxSection, (s) => s.title);
    const hasNoParameters = /```js-nolint\n(?:.+\(\)\n+)+```/.test(
      `${syntaxSection}`,
    );
    checkHeadingSequence(
      syntaxHeadings,
      context.frontMatter["page-type"].endsWith("accessor-property") ||
        hasNoParameters
        ? ["Return value", "Exceptions", "Aliasing"]
        : ["Parameters", "Return value", "Exceptions", "Aliasing"],
      context,
      (heading: string) => {
        if (
          /operator|statement|language-feature/.test(
            context.frontMatter["page-type"],
          )
        )
          return true;
        if (
          context.frontMatter["page-type"].endsWith("constructor") &&
          heading === "Return value"
        )
          return true;
        return ["Exceptions", "Aliasing"].includes(heading);
      },
    );
  }
}

Object.defineProperty(rule, "name", { value: "heading" });

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].startsWith("javascript");
