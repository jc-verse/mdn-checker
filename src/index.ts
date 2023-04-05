import "./polyfill.js";

import FS from "node:fs/promises";
import Path from "node:path";
import type { Root } from "mdast";
import { parse, type File, type FrontMatter } from "./parser/index.js";

async function* getFiles(
  dir: string,
): AsyncGenerator<[string, File], void, never> {
  const dirents = await FS.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const subPath = Path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(subPath);
    } else if (dirent.name.endsWith(".md")) {
      const source = await FS.readFile(subPath, "utf-8");
      const file = parse(source, subPath);
      yield [subPath, file];
    }
  }
}

const contentPath = Path.resolve(process.cwd(), process.argv[2]!);
const javascriptPath = Path.join(contentPath, "files/en-us/web/javascript");

const [rules, files] = await Promise.all([
  Promise.all([
    // Import("./rules/bad-dl.js"),
    // import("./rules/heading.js"),
    // import("./rules/deprecation-note.js"),
    import("./rules/syntax-section.js"),
  ]),
  Array.fromAsync(getFiles(javascriptPath)),
]);

const pathToFile = new Map(files);

export class Context {
  files = pathToFile;
  path = "";
  source = "";
  ast: Root = null!;
  frontMatter: FrontMatter = null!;
  constructor(path: string, file: File) {
    this.path = path;
    Object.assign(this, file);
  }
  report(message: unknown): void {
    console.error(
      `\u001B]8;;${this.path}\u0007${this.frontMatter.title}\u001B]8;;\u0007: ${this.path}`,
    );
    console.error(message);
  }
}

pathToFile.forEach((file, path) => {
  rules.forEach(({ default: rule }) => {
    const context = new Context(path, file);
    if (rule.appliesTo(context)) rule(context);
  });
});
