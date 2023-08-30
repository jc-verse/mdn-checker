import { unified } from "unified";
import remark from "remark-parse";
import gfm from "remark-gfm";
import frontMatter from "remark-frontmatter";
import definitionList from "./dl.js";
import callout from "./callout.js";
import macro from "./macro.js";
import type { Root } from "mdast";

const pipeline = unified()
  .use(remark)
  .use(frontMatter)
  .use(gfm)
  .use(definitionList)
  .use(callout)
  .use(macro);

export function parseMarkdown(source: string): Root {
  const ast = pipeline.parse(source);
  const transformed = pipeline.runSync(ast) as Root;
  return transformed;
}
