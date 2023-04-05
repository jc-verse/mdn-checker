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
      heading: context.source
        .slice(heading.position!.start.offset!, heading.position!.end.offset!)
        .replace(/^#+ /, ""),
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
  const expected =
    headingSequence[
      context.frontMatter["page-type"] as keyof typeof headingSequence
    ];
  let actualInd = 0,
    expectedInd = 0;
  while (actualInd < tree.length && expectedInd < expected.length) {
    const actualText = tree[actualInd]!.heading;
    const expectedText = expected[expectedInd]!;
    if (actualText === expectedText) {
      actualInd++;
      expectedInd++;
      continue;
    }
    const actualInExpectedInd = expected.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      (t, ind) => ind > expectedInd && t === actualText,
    );
    const expectedInActualInd = tree.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      (t, ind) => ind > actualInd && t.heading === expectedText,
    );
    // At most one should be positive;
    // both are negative means no need to match further
    if (actualInExpectedInd * expectedInActualInd > 0) break;
    if (expectedInActualInd >= 0) {
      context.report(
        `Unrecognized headings: ${tree
          .slice(actualInd, expectedInActualInd)
          .map((t) => t.heading)
          .join(", ")}`,
      );
      actualInd = expectedInActualInd;
    } else {
      const allExpected = expected
        .slice(expectedInd, actualInExpectedInd)
        .filter((t) => !headingIsOptional(t, context));
      if (allExpected.length > 0)
        context.report(`Missing headings: ${allExpected.join(", ")}`);
      expectedInd = actualInExpectedInd;
    }
  }
  if (expectedInd < expected.length) {
    context.report(
      `Missing headings: ${expected.slice(expectedInd).join(", ")}`,
    );
  }
  if (actualInd < tree.length) {
    context.report(
      `Unrecognized headings: ${tree
        .slice(actualInd)
        .map((t) => t.heading)
        .join(", ")}`,
    );
  }
}

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].startsWith("javascript");
