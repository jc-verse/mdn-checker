import { editingSteps } from "../utils.js";
import type { Context } from "../context.js";

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
};

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

function headingIsOptional(heading: string, context: Context) {
  const optionalOnes = [
    "Description",
    "Constructor",
    "Static properties",
    "Static methods",
    "Instance properties",
    "Instance methods",
  ];
  if (
    context.frontMatter["page-type"].endsWith("accessor-property") &&
    !context.frontMatter.title.includes("@@")
  )
    optionalOnes.push("Syntax");
  return optionalOnes.includes(heading);
}

export default function rule(context: Context): void {
  const topHeadings = Array.from(context.tree, (section) => section.title);
  let expectedTexts =
    headingSequence[
      context.frontMatter["page-type"] as keyof typeof headingSequence
    ];
  if (context.frontMatter.title === "The arguments object") {
    expectedTexts = expectedTexts.toSpliced(
      expectedTexts.indexOf("Examples"),
      0,
      "Properties",
    );
  }
  const edits = editingSteps(topHeadings, expectedTexts).filter(
    (e) => e[0] !== "i" || !headingIsOptional(e[1], context),
  );
  if (edits.length) {
    context.report(
      `Unexpected headings:
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

Object.defineProperty(rule, "name", { value: "heading" });

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].startsWith("javascript");
