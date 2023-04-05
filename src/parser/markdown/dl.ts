import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type {
  List,
  Parent,
  Content,
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "mdast";

const DEFINITION_PREFIX = ": ";

function assert(x: unknown): asserts x {}

function isDefinitionList(node: List) {
  return (
    !node.ordered &&
    node.children.every((listItem) => {
      if (listItem.children.length < 2) return false;
      const definition = listItem.children.at(-1)!;
      if (definition.type !== "list" || definition.children.length !== 1)
        return false;
      const firstParagraph = definition.children[0]!.children[0];
      return (
        firstParagraph?.type === "paragraph" &&
        firstParagraph.children?.[0]?.type === "text" &&
        firstParagraph.children[0].value.startsWith(DEFINITION_PREFIX)
      );
    })
  );
}

function asDefinitionList(node: List): DescriptionList {
  const children = node.children.flatMap((listItem) => {
    const definition = listItem.children.at(-1)!;
    assert(definition.type === "list" && definition.children.length === 1);
    const firstParagraph = definition.children[0]!.children[0];
    assert(
      firstParagraph?.type === "paragraph" &&
        firstParagraph.children?.[0]?.type === "text",
    );
    firstParagraph.children[0].value = firstParagraph.children[0].value.slice(
      DEFINITION_PREFIX.length,
    );
    return [
      {
        type: "dt",
        children: listItem.children.slice(0, -1),
        position: definition.position,
      } satisfies DescriptionTerm,
      {
        type: "dd",
        children: definition.children[0]!.children,
        position: definition.position,
      } satisfies DescriptionDetails,
    ];
  });
  return {
    type: "dl",
    children,
    position: node.position,
  };
}

const definitionList: Plugin = () => (tree) => {
  visit(tree, "list", (node: List, index: number, parent: Parent) => {
    if (isDefinitionList(node))
      parent.children[index] = asDefinitionList(node) as unknown as Content;
  });
};

export default definitionList;
