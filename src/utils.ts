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

export function toJSxRef(frontMatter: FrontMatter): string {
  if (frontMatter.title.match(/__.+__/))
    return `[\`${frontMatter.title}\`](/en-US/docs/${frontMatter.slug})`;
  switch (frontMatter["page-type"]) {
    case "javascript-class":
    case "javascript-namespace":
      return `{{jsxref("${frontMatter.title}")}}`;
    case "javascript-constructor": {
      const objName = frontMatter.title.replace("() constructor", "");
      if (objName.startsWith("Intl.")) {
        const unprefixed = objName.replace("Intl.", "");
        return `{{jsxref("Intl/${unprefixed}/${unprefixed}", "${objName}()")}}`;
      }
      return `{{jsxref("${objName}/${objName}", "${objName}()")}}`;
    }
    case "javascript-instance-method":
    case "javascript-static-method": {
      if (frontMatter.title.includes("@@"))
        return `[\`${frontMatter.title}\`](/en-US/docs/${frontMatter.slug})`;
      if (frontMatter.title.startsWith("Intl.")) {
        return `{{jsxref("${frontMatter.slug.match(/Intl.*/)![0]!}", "${
          frontMatter.title
        }")}}`;
      }
      return `{{jsxref("${frontMatter.title}")}}`;
    }
    case "javascript-instance-accessor-property":
    case "javascript-static-accessor-property":
    case "javascript-static-data-property": {
      const cleanTitle = frontMatter.title.replace("get ", "");
      if (frontMatter.title.startsWith("Intl.")) {
        return `{{jsxref("${frontMatter.slug.match(
          /Intl.*/,
        )![0]!}", "${cleanTitle}")}}`;
      }
      if (frontMatter.title.includes("@@")) {
        return `{{jsxref("${frontMatter.slug
          .split("/")
          .slice(-2)
          .join("/")}", "${cleanTitle}")}}`;
      }
      return `{{jsxref("${cleanTitle}")}}`;
    }
    case "javascript-instance-data-property": {
      if (frontMatter.title.startsWith("Intl.")) {
        return `{{jsxref("${frontMatter.slug.match(/Intl.*/)![0]!}", "${
          frontMatter.title
        }")}}`;
      }
      if (frontMatter.title.includes("@@")) {
        return `{{jsxref("${frontMatter.slug
          .split("/")
          .slice(-2)
          .join("/")}", "${frontMatter.title}")}}`;
      }
      if (frontMatter.title.includes(": ")) {
        return `{{jsxref("${frontMatter.slug
          .split("/")
          .slice(-2)
          .join("/")}", "${frontMatter.title.replace(/.*: /, "")}")}}`;
      }
      return `{{jsxref("${frontMatter.title}")}}`;
    }
    default:
      return "";
  }
}
