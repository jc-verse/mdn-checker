import type { FrontMatter } from "./parser/front-matter.js";

export function interpolate(
  text: string,
  params: Record<string, unknown>,
): string {
  return text.replace(
    // eslint-disable-next-line prefer-named-capture-group
    /~([^~]+)~/g,
    (match, p1) =>
      // eslint-disable-next-line no-new-func
      Function(...Object.keys(params), `return ${p1}`)(Object.values(params)),
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

function last(slug: string, n: number): string {
  return slug.split("/").slice(-n).join("/");
}

export function toJSxRef(frontMatter: FrontMatter): string {
  if (
    frontMatter.title.match(/__.+__/) ||
    frontMatter.title.startsWith("Segments") ||
    (frontMatter.title.includes("@@") &&
      frontMatter["page-type"].endsWith("-method"))
  )
    return `[\`${frontMatter.title}\`](/en-US/docs/${frontMatter.slug})`;
  switch (frontMatter["page-type"]) {
    case "javascript-class":
    case "javascript-namespace":
      return `{{jsxref("${frontMatter.title}")}}`;
    case "javascript-constructor": {
      const objName = frontMatter.title.replace(" constructor", "");
      return `{{jsxref("${last(
        frontMatter.slug,
        objName.startsWith("Intl.") ? 3 : 2,
      )}", "${objName}")}}`;
    }
    case "javascript-instance-method":
    case "javascript-static-method": {
      if (frontMatter.title.startsWith("Intl.")) {
        return `{{jsxref("${last(frontMatter.slug, 3)}", "${
          frontMatter.title
        }")}}`;
      }
      return `{{jsxref("${frontMatter.title}")}}`;
    }
    case "javascript-instance-accessor-property":
    case "javascript-static-accessor-property": {
      if (/ \(\$.\)$|…/.test(frontMatter.title)) {
        return `{{jsxref("${last(frontMatter.slug, 2).replaceAll(
          "/",
          ".",
        )}", "${frontMatter.title}")}}`;
      }
    }
    // Fallthrough
    case "javascript-static-data-property": {
      const cleanTitle = frontMatter.title.replace("get ", "");
      if (frontMatter.title.startsWith("Intl."))
        return `{{jsxref("${last(frontMatter.slug, 3)}", "${cleanTitle}")}}`;
      if (frontMatter.title.includes("@@"))
        return `{{jsxref("${last(frontMatter.slug, 2)}", "${cleanTitle}")}}`;
      return `{{jsxref("${cleanTitle}")}}`;
    }
    case "javascript-instance-data-property": {
      if (frontMatter.title.startsWith("Intl.")) {
        return `{{jsxref("${last(frontMatter.slug, 3)}", "${
          frontMatter.title
        }")}}`;
      }
      if (frontMatter.title.includes("@@")) {
        return `{{jsxref("${last(frontMatter.slug, 2)}", "${
          frontMatter.title
        }")}}`;
      }
      if (frontMatter.title.includes(": ")) {
        return `{{jsxref("${last(
          frontMatter.slug,
          2,
        )}", "${frontMatter.title.replace(/.*: /, "")}")}}`;
      }
      return `{{jsxref("${frontMatter.title}")}}`;
    }
    default:
      return "";
  }
}
