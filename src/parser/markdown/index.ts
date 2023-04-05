import { unified } from "unified";
import remark from "remark-parse";
import gfm from "remark-gfm";
import definitionList from "./dl.js";
import callout from "./callout.js";
import type { Root } from "mdast";

const parser = unified().use(remark).use(gfm);
const transformer = unified().use(definitionList).use(callout);

export function parseMarkdown(source: string): Root {
  const ast = parser.parse(source);
  const transformed = transformer.runSync(ast) as Root;
  return transformed;
}
