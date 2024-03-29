import { output } from "./arguments.js";
import type { FileContext } from "./context.js";
import type { Heading, Content } from "mdast";

// eslint-disable-next-line consistent-return
export function color(c: string, text: string): string {
  switch (output) {
    case "stderr":
    case "stdout":
    case "json":
      // For JSON, we assume you are using an ANSI previewer
      return `\x1b[${
        {
          red: 31,
          green: 32,
          yellow: 33,
          blue: 34,
          magenta: 35,
          cyan: 36,
        }[c] ?? 39
      }m${text}\x1b[39m`;
    case "html":
      return `<span style="color:var(--${c});">${text}</span>`;
  }
}

export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U,
): Record<string, U>;
export function mapValues(
  obj: unknown,
  fn: (value: unknown, key: string) => unknown,
): unknown;
export function mapValues(
  obj: unknown,
  fn: (value: unknown, key: string) => unknown,
): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
}

export function toEnglish(str: string): string {
  switch (str) {
    case "RegExp":
      return "(?:regex|regular expression)";
    case "ArrayBuffer":
      return "(?:array )?buffer";
    case "DataView":
      return "(?:data )?view";
    case "Intl.Locale":
      return "locale";
    case "SharedArrayBuffer":
    case "Segments":
    case "arguments":
      return `\`${str}\``;
    default: {
      const words = str.split(/(?=[A-Z])/);
      return words.map((w) => w.toLowerCase()).join(" ");
    }
  }
}

export function interpolate(
  text: string,
  params: Record<string, unknown>,
): string {
  return text.replace(
    // eslint-disable-next-line prefer-named-capture-group
    /~((?:[^~]|(?<=\\)~)+)~/gu,
    (match, p1) => {
      try {
        // eslint-disable-next-line no-new-func
        return Function(
          ...Object.keys(params),
          `return ${p1}`,
        )(...Object.values(params));
      } catch (e) {
        throw new Error(`Failed to interpolate the expression: ${p1}`, {
          cause: e,
        });
      }
    },
  );
}

export function escapeRegExp(
  strings: TemplateStringsArray | string,
  ...args: string[]
): string {
  if (typeof strings === "string")
    return strings.replace(/[\^$\\.*+?()[\]{}|]/gu, "\\$&");
  return String.raw({ raw: strings.map((s) => escapeRegExp(s)) }, ...args);
}

export function printRegExp(pattern: RegExp): string {
  return (
    pattern.source
      .replace(/(?<!\\)[\^$\\.*+?()[\]{}|]/gu, color("cyan", "$&"))
      // eslint-disable-next-line prefer-named-capture-group
      .replace(/(?<!\\)\\([\^$\\.*+?()[\]{}|])/gu, "$1")
  );
}

type Action = ["d", string] | ["i", string] | ["s", string, string];

export function editingSteps(start: string[], end: string[]): Action[] {
  const dp: Action[][][] = Array.from({ length: start.length + 1 }, () =>
    Array.from({ length: end.length + 1 }),
  );
  dp[0]![0] = [];
  for (let i = 1; i <= start.length; i++)
    dp[i]![0] = [...dp[i - 1]![0]!, ["d", start[i - 1]!]];
  for (let j = 1; j <= end.length; j++)
    dp[0]![j] = [...dp[0]![j - 1]!, ["i", end[j - 1]!]];
  for (let i = 0; i < start.length; i++) {
    for (let j = 0; j < end.length; j++) {
      if (start[i] === end[j]) {
        dp[i + 1]![j + 1] = [...dp[i]![j]!];
      } else {
        const alternatives = [dp[i]![j + 1]!, dp[i + 1]![j]!, dp[i]![j]!].map(
          (x) => x.length,
        );
        switch (alternatives.indexOf(Math.min(...alternatives))) {
          case 0:
            dp[i + 1]![j + 1] = [...dp[i]![j + 1]!, ["d", start[i]!]];
            break;
          case 1:
            dp[i + 1]![j + 1] = [...dp[i + 1]![j]!, ["i", end[j]!]];
            break;
          case 2:
            dp[i + 1]![j + 1] = [...dp[i]![j]!, ["s", start[i]!, end[j]!]];
            break;
        }
      }
    }
  }
  return dp[start.length]![end.length]!;
}

export class Section {
  #nodes;
  #context;
  #depth;
  #title;
  #headings;
  constructor(
    nodes: Content[],
    context: FileContext,
    depth: number,
    title: string,
  ) {
    this.#nodes = nodes;
    this.#context = context;
    this.#depth = depth;
    this.#title = title;
    this.#headings = this.#nodes.filter(
      (node): node is Heading =>
        node.type === "heading" && (node as Heading).depth === this.#depth,
    );
  }
  get title(): string {
    return this.#title;
  }
  get ast(): Content[] {
    return this.#nodes;
  }
  get intro(): Content[] {
    // If there are no headings, this is slice(0, -1), which is the entire array
    return this.#nodes.slice(0, this.#nodes.indexOf(this.#headings[0]!));
  }
  getSubsection(
    titleOrIndex: string | number,
    { withTitle = false } = {},
  ): Section | undefined {
    const targetIndex =
      typeof titleOrIndex === "string"
        ? this.#headings.findIndex(
            (heading) =>
              this.#context.getSource(heading.children) === titleOrIndex,
          )
        : titleOrIndex;
    const heading = this.#headings[targetIndex];
    if (!heading) return undefined;
    const index = this.#nodes.indexOf(heading);
    const nextHeadingIndex =
      targetIndex < this.#headings.length - 1
        ? this.#nodes.indexOf(this.#headings[targetIndex + 1]!)
        : undefined;
    const title = this.#context.getSource(heading.children);
    return new Section(
      this.#nodes.slice(withTitle ? index : index + 1, nextHeadingIndex),
      this.#context,
      this.#depth + 1,
      title,
    );
  }
  *[Symbol.iterator](): Generator<Section> {
    let subsection = undefined;
    let i = 0;
    // eslint-disable-next-line no-cond-assign
    while ((subsection = this.getSubsection(i++, { withTitle: false })))
      yield subsection;
  }
  toString(): string {
    return this.#context.getSource(this.#nodes);
  }
}

export function slugToFilePath(slug: string): string {
  return decodeURIComponent(
    slug
      .toLowerCase()
      .replaceAll("*", "_star_")
      // cSpell:ignore doublecolon
      .replaceAll("::", "_doublecolon_")
      .replaceAll(":", "_colon_")
      .replaceAll("?", "_question_")
      .replaceAll("/en-us/docs/", "files/en-us/"),
  );
}
