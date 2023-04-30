import FS from "node:fs/promises";
import Path from "node:path";
import { loadConfig } from "./config.js";
import { parse, type File, type FrontMatter } from "./parser/index.js";
import type { Root } from "mdast";
import type { Node } from "unist";

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

if (!process.argv[2]) throw new Error("No content path specified");

const contentPath = Path.resolve(process.cwd(), process.argv[2]);
const javascriptPath = Path.join(contentPath, "files/en-us/web/javascript");

const [allRules, files, config] = await Promise.all([
  Promise.all([
    // Load rules; each import() must take a literal to allow static analysis
    import("./rules/bad-dl.js"),
    import("./rules/class-members.js"),
    import("./rules/data-prop.js"),
    import("./rules/deprecation-note.js"),
    import("./rules/description.js"),
    import("./rules/heading.js"),
    import("./rules/spec-alignment.js"),
    import("./rules/syntax-section.js"),
  ]),
  Array.fromAsync(getFiles(javascriptPath)),
  loadConfig(),
]);

export const rules = allRules.filter((rule) => config.rules[rule.default.name]);

export const pathToFile = new Map(files);

export class Context {
  static #descriptions = new Map<string, string>();
  path = "";
  source = "";
  ast!: Root;
  frontMatter!: FrontMatter;
  #currentName = "";
  constructor(path: string, file: File) {
    this.path = path;
    Object.assign(this, file);
  }
  setName(name: string): void {
    this.#currentName = name;
  }
  report(message: unknown): void {
    console.error(
      `\u001B]8;;${this.path}\u0007${this.frontMatter.title}\u001B]8;;\u0007: ${this.path}`,
    );
    console.error(`[${this.#currentName}]`, message);
  }
  getSource(node: Node, file: File = this): string {
    return file.source.slice(
      node.position!.start.offset,
      node.position!.end.offset,
    );
  }
  getSubpages(path?: string, options?: { withPath?: false }): File[];
  getSubpages(
    path: string | undefined,
    options: { withPath: true },
  ): [string, File][];
  getSubpages(
    path?: string,
    { withPath = false }: { withPath?: boolean } = {},
  ): ([string, File] | File)[] {
    const subpages: ([string, File] | File)[] = [];
    const basePath = Path.dirname(path ?? this.path);
    for (const [p, file] of pathToFile) {
      if (Path.dirname(Path.dirname(p)) === basePath)
        subpages.push(withPath ? [p, file] : file);
    }
    return subpages;
  }
  getFile(path: string): File | undefined {
    return pathToFile.get(Path.resolve(javascriptPath, path, "index.md"));
  }
  getDescription(
    path: string = Path.dirname(Path.relative(javascriptPath, this.path)),
  ): string {
    let description = Context.#descriptions.get(path);
    if (description) return description;
    const file = this.getFile(path);
    if (!file) return "";
    const descriptionNode = file.ast.children.find(
      (node) =>
        node.type === "paragraph" &&
        !/^\{\{.*\}\}$/u.test(this.getSource(node, file)),
    );
    if (!descriptionNode) return "";
    // TODO new lines should be removed from source
    description = this.getSource(descriptionNode).replaceAll("\n", " ");
    Context.#descriptions.set(path, description);
    return description;
  }
}

export const exitContext = new (class {
  #currentName = "";
  setName(name: string): void {
    this.#currentName = name;
  }
  report(message: unknown): void {
    console.error(`[${this.#currentName}]`, message);
  }
})();

export type ExitContext = typeof exitContext;
