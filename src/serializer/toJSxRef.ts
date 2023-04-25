import type { FrontMatter } from "../parser/front-matter.js";

function last(slug: string, n: number): string {
  return slug.split("/").slice(-n).join("/");
}

function getArguments(frontMatter: FrontMatter): string[] {
  switch (frontMatter["page-type"]) {
    case "javascript-class":
    case "javascript-namespace":
      return [frontMatter.title];
    case "javascript-constructor": {
      const objName = frontMatter.title.replace(" constructor", "");
      return [
        last(frontMatter.slug, objName.startsWith("Intl.") ? 3 : 2),
        objName,
      ];
    }
    case "javascript-instance-method":
    case "javascript-static-method": {
      if (
        frontMatter.title.startsWith("Intl.") &&
        frontMatter.slug.split("/").at(-2) !== "Intl"
      )
        return [last(frontMatter.slug, 3), frontMatter.title];

      return [frontMatter.title];
    }
    case "javascript-instance-accessor-property":
    case "javascript-static-accessor-property": {
      if (/ \(\$.\)$/.test(frontMatter.title)) {
        return [
          last(frontMatter.slug, 2).replaceAll("/", "."),
          frontMatter.title,
        ];
      }
      if (/…/.test(frontMatter.title))
        return [last(frontMatter.slug, 2), frontMatter.title];
    }
    // Fallthrough
    case "javascript-static-data-property": {
      if (frontMatter.title.startsWith("Intl."))
        return [last(frontMatter.slug, 3), frontMatter.title];
      if (frontMatter.title.includes("@@"))
        return [last(frontMatter.slug, 2), frontMatter.title];
      return [frontMatter.title];
    }
    case "javascript-instance-data-property": {
      if (frontMatter.title.startsWith("Intl."))
        return [last(frontMatter.slug, 3), frontMatter.title];

      if (frontMatter.title.includes("@@"))
        return [last(frontMatter.slug, 2), frontMatter.title];

      if (frontMatter.title.includes(": ")) {
        return [
          last(frontMatter.slug, 2),
          frontMatter.title.replace(/.*: /, ""),
        ];
      }
      return [frontMatter.title];
    }
    case "javascript-language-feature": {
      if (frontMatter.title === "The arguments object")
        return ["Functions/arguments", "arguments"];
    }
    // Fallthrough
    default:
      return [];
  }
}

export function toJSxRef(frontMatter: FrontMatter): string {
  if (
    frontMatter.title.match(/__.+__/) ||
    frontMatter.title.startsWith("Segments") ||
    (frontMatter.title.includes("@@") &&
      frontMatter["page-type"].endsWith("-method"))
  )
    return `[\`${frontMatter.title}\`](/en-US/docs/${frontMatter.slug})`;
  return `{{jsxref("${getArguments(frontMatter).join('", "')}")}}`;
}
