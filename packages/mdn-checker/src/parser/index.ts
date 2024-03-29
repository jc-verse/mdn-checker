import { parseFrontMatter, type FrontMatter } from "./front-matter.js";
import { parseMarkdown } from "./markdown/index.js";
import type { FileContext } from "../context.js";

export type File = Pick<FileContext, "source" | "ast" | "frontMatter">;
export type { FrontMatter };

export function parse(source: string): File {
  const frontMatter = parseFrontMatter(source);
  const ast = parseMarkdown(source);
  return { source, ast, frontMatter };
}
