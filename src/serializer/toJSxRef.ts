import type { FrontMatter } from "../parser/front-matter.js";

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
      if (
        frontMatter.title.startsWith("Intl.") &&
        frontMatter.slug.split("/").at(-2) !== "Intl"
      ) {
        return `{{jsxref("${last(frontMatter.slug, 3)}", "${
          frontMatter.title
        }")}}`;
      }
      return `{{jsxref("${frontMatter.title}")}}`;
    }
    case "javascript-instance-accessor-property":
    case "javascript-static-accessor-property": {
      if (/ \(\$.\)$/.test(frontMatter.title)) {
        return `{{jsxref("${last(frontMatter.slug, 2).replaceAll(
          "/",
          ".",
        )}", "${frontMatter.title}")}}`;
      }
      if (/…/.test(frontMatter.title)) {
        return `{{jsxref("${last(frontMatter.slug, 2)}", "${
          frontMatter.title
        }")}}`;
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
    case "javascript-language-feature": {
      if (frontMatter.title === "The arguments object")
        return `{{jsxref("Functions/arguments", "arguments")}}`;
    }
    // Fallthrough
    default:
      return "";
  }
}
