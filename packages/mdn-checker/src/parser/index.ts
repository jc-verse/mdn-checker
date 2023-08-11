import { parseFrontMatter, type FrontMatter } from "./front-matter.js";
import { parseMarkdown } from "./markdown/index.js";
import type { Context } from "../context.js";

export type File = Pick<Context, "source" | "ast" | "frontMatter">;
export type { FrontMatter };

export function parse(source: string, subPath: string): File {
  const frontMatter = parseFrontMatter(source, subPath);
  const ast = parseMarkdown(source);
  return { source, ast, frontMatter };
}
