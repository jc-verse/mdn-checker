import { visit } from "unist-util-visit";
import type { Blockquote, Parent, Content, Callout } from "mdast";
import type { Plugin } from "unified";

function toCallout(node: Blockquote): Blockquote | Callout {
  const firstParagraph = node.children[0];
  if (firstParagraph?.type !== "paragraph") return node;
  const firstText = firstParagraph.children[0];
  if (firstText?.type !== "strong") return node;
  const strongText = firstText.children[0];
  if (
    strongText?.type !== "text" ||
    !["Note:", "Warning:", "Callout:"].includes(strongText.value)
  )
    return node;
  firstParagraph.children.shift();
  if (firstParagraph.children.length === 0) {node.children.shift();}
  else
    {firstParagraph.position!.start =
      firstParagraph.children[0]!.position!.start;}
  return {
    type: "callout",
    kind: strongText.value.slice(0, -1) as Callout["kind"],
    children: node.children,
    position: node.position,
  };
}

const callout: Plugin = () => (tree) => {
  visit(
    tree,
    "blockquote",
    (node: Blockquote, index: number, parent: Parent) => {
      parent.children[index] = toCallout(node) as unknown as Content;
    },
  );
};

export default callout;
