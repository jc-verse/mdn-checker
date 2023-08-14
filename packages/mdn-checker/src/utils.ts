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
    /~([^~]+)~/gu,
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
      .replace(/(?<!\\)[\^$\\.*+?()[\]{}|]/gu, "\x1b[36m$&\x1b[39m")
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
    dp[i]![0] = [...dp[i - 1]![0]!, ["d", start[i]!]];
  for (let j = 1; j <= end.length; j++)
    dp[0]![j] = [...dp[0]![j - 1]!, ["i", end[j]!]];
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
