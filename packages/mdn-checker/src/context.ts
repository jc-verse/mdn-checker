import Path from "node:path";
import { Section } from "./utils.js";
import type { File, FrontMatter } from "./parser/index.js";
import type { Root } from "mdast";
import type { Node } from "unist";

if (!process.argv[2]) throw new Error("No content path specified");

export const contentPath = Path.resolve(process.cwd(), process.argv[2]);
export const javascriptPath = Path.join(
  contentPath,
  "files/en-us/web/javascript",
);
// This map is populated by index.js
export const pathToFile = new Map<string, File>();

const descriptions = new Map<string, string>();

export type Report = { message: string; node: Node | undefined };

export abstract class BaseContext {
  #currentName = "";
  reports: { [ruleName: string]: Report[] } = {};
  setName(name: string): void {
    this.#currentName = name;
  }
  report(message: unknown, node?: Node): void {
    this.reports[this.#currentName] ??= [];
    this.reports[this.#currentName]!.push({ message: String(message), node });
  }
}

export class FileContext extends BaseContext {
  path;
  source!: string;
  ast!: Root;
  frontMatter!: FrontMatter;
  constructor(path: string, file: File) {
    super();
    this.path = path;
    Object.assign(this, file);
  }
  getSource(node: Node | Node[], file: File = this): string {
    if (Array.isArray(node) && node.length === 0) return "";
    const start = Array.isArray(node) ? node[0]! : node;
    const end = Array.isArray(node) ? node.at(-1)! : node;
    return file.source.slice(
      start.position!.start.offset,
      end.position!.end.offset,
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
    let description = descriptions.get(path);
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
    description = this.getSource(descriptionNode, file).replaceAll("\n", " ");
    descriptions.set(path, description);
    return description;
  }
  get tree(): Section {
    return new Section(this.ast.children, this, 2, this.frontMatter.title);
  }
}

export class ExitContext extends BaseContext {}
