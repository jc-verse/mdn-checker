import { editingSteps } from "../utils.js";
import type { Context } from "../index.js";
import type { Heading } from "mdast";

type TOCTreeNode = { heading: string; children: TOCTreeNode[] };

function treeifyTOC(headings: Heading[], context: Context): TOCTreeNode[] {
  const items = headings.map((heading) => ({
    ...heading,
    parentIndex: -1,
    children: [] as TOCTreeNode[],
  }));

  const prevIndexForLevel = Array<number>(7).fill(-1);

  items.forEach((curr, currIndex) => {
    const ancestorLevelIndexes = prevIndexForLevel.slice(2, curr.depth);
    curr.parentIndex = Math.max(...ancestorLevelIndexes);
    prevIndexForLevel[curr.depth] = currIndex;
  });

  const rootNodes: TOCTreeNode[] = [];

  items.forEach((heading) => {
    (heading.parentIndex >= 0
      ? items[heading.parentIndex]!.children
      : rootNodes
    ).push({
      heading: context.getSource(heading).replace(/^#+ /, ""),
      children: heading.children,
    });
  });
  return rootNodes;
}

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
  const headings = context.ast.children.filter(
    (node): node is Heading => node.type === "heading",
  );
  // For (const heading of headings) {
  //   if (heading.children.length !== 1)
  //     context.report("Heading has multiple children");
  // }
  const tree = treeifyTOC(headings, context);
  const actualTexts = tree.map((t) => t.heading);
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
  const edits = editingSteps(actualTexts, expectedTexts).filter(
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

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].startsWith("javascript");
