import Path from "node:path";
import { slugToFilePath } from "../utils.js";
import type { List, ListItem, Macro } from "mdast";
import type { FileContext } from "../context.js";

function linkIsInternal(href: string) {
  return (
    new URL(href, "https://developer.mozilla.org/").hostname ===
    "developer.mozilla.org"
  );
}

const wellKnownSites = [
  "blog.mozilla.org",
  "blogs.windows.com",
  "developer.chrome.com",
  "esdiscuss.org",
  "GitHub",
  "hacks.mozilla.org",
  "innolitics.com",
  "javascript.info",
  "pouchdb.com",
  "Stack Overflow",
  "v8.dev",
  "web.dev",
  "Wikipedia",
];

type SeeAlsoItem =
  | { type: "link-internal"; text: string; url: string; extra?: string }
  | { type: "link-external"; text: string; url: string; extra: string }
  | { type: "polyfill"; text: string; url: string }
  | { type: "xref"; content: Macro }
  | { type: "invalid"; message: string };

function parseSeeAlsoItem(item: ListItem, context: FileContext): SeeAlsoItem {
  if (item.children.length !== 1 || item.children[0]?.type !== "paragraph")
    return { type: "invalid", message: "Item must be a single paragraph" };
  const p = item.children[0]!;
  if (p.children.length === 1) {
    const link = p.children[0]!;
    switch (link.type) {
      case "link":
        if (
          /zloirock\/core-js|formatjs\.io\/docs\/polyfills|formatjs\/formatjs/u.test(
            link.url,
          )
        ) {
          return {
            type: "polyfill",
            text: context.getSource(link.children),
            url: link.url,
          };
        }
        if (!linkIsInternal(link.url)) {
          return {
            type: "invalid",
            message: `External links must have extra text: '${context.getSource(
              link,
            )}'`,
          };
        }
        return {
          type: "link-internal",
          text: context.getSource(link.children),
          url: link.url,
        };
      case "macro":
        if (
          !/domxref|HTTPHeader|HTMLElement|Glossary|jsxref/iu.test(link.name)
        ) {
          return {
            type: "invalid",
            message: `Non-link item must be an xref: ${context.getSource(
              link,
            )}`,
          };
        }
        return { type: "xref", content: link };
      default:
        return {
          type: "invalid",
          message: `'${context.getSource(
            link,
          )}' must be either a link or an xref`,
        };
    }
  } else if (
    p.children.length === 2 &&
    p.children[0]!.type === "link" &&
    p.children[1]!.type === "text"
  ) {
    const link = p.children[0]!;
    const text = p.children[1]!;
    return {
      type: linkIsInternal(link.url) ? "link-internal" : "link-external",
      text: context.getSource(link.children),
      url: link.url,
      extra: context.getSource(text).trim(),
    };
  } else if (
    p.children.length === 3 &&
    p.children[0]!.type === "link" &&
    p.children[1]!.type === "text" &&
    p.children[2]!.type === "link"
  ) {
    const link1 = p.children[0]!;
    const text = p.children[1]!;
    const link2 = p.children[2]!;
    if (linkIsInternal(link1.url) || text.value !== " by ") {
      return {
        type: "invalid",
        message: `Expected item to be in the format '[link]() by [author]()'`,
      };
    }
    return {
      type: "link-external",
      text: context.getSource(link1.children),
      url: link1.url,
      extra: context.getSource([text, link2]).trim(),
    };
  } else {
    return {
      type: "invalid",
      message: `'${context.getSource(
        p,
      )}' should be in the format '[link]() on/by ...'`,
    };
  }
}

export default function rule(context: FileContext): void {
  let seeAlsoSection = context.tree.getSubsection("See also")?.ast;
  if (!seeAlsoSection) return;
  if (
    seeAlsoSection.length === 2 &&
    /\{\{PreviousNext\(.*\)\}\}/u.test(context.getSource(seeAlsoSection[1]!))
  )
    seeAlsoSection = seeAlsoSection.slice(0, 1);
  if (seeAlsoSection.length !== 1 && seeAlsoSection[0]!.type !== "list") {
    context.report("See also section must be a single list");
    return;
  }
  const items = (seeAlsoSection[0] as List).children.map((i) =>
    parseSeeAlsoItem(i, context),
  );
  for (const item of items) {
    switch (item.type) {
      case "invalid":
        context.report(item.message);
        break;
      case "link-external": {
        const site = /^on (?<name>[A-Za-z0-9. ]+)/u
          .exec(item.extra)
          ?.groups!.name!.trim();
        const docs = /^in (?<name>[-\w. ]+)/u
          .exec(item.extra)
          ?.groups!.name!.trim();
        if (site) {
          if (!wellKnownSites.includes(site)) {
            context.report(
              `Unknown site '${site}' in extra text '${item.extra}'`,
            );
          }
        } else if (docs) {
          if (
            !/the (?:HTML standard|Node\.js docs|Firefox source docs|V8 docs|TC39 [a-z-]+ proposal|Unicode locale data markup language spec)/u.test(
              docs,
            )
          ) {
            context.report(
              `Unknown docs source '${docs}' in extra text '${item.extra}'`,
            );
          }
        } else if (!/^(?:presentation |slide show )?by .+/.test(item.extra)) {
          context.report(`'${item.extra}' should be 'on/in/by ...'`);
        }
        break;
      }
      case "link-internal": {
        if (!item.url.startsWith("/en-US/docs/Web/JavaScript/")) break;
        // TODO check anchor links
        if (item.url.includes("#")) break;
        const targetFile = context.getFile(
          Path.relative(
            "files/en-us/web/javascript/",
            slugToFilePath(item.url),
          ),
        );
        if (!targetFile) {
          context.report(`Could not find target file '${item.url}'`);
          break;
        }
        let targetTitle = targetFile.frontMatter.title;
        if (item.url.endsWith("Template_literals"))
          targetTitle = "Template literals";
        if (item.url.includes("Guide") && item.extra !== "guide") {
          context.report(
            `Expected item ${item.text} to have extra 'guide' suffix`,
          );
        }
        const linkText = item.text.replaceAll("`", "");
        if (linkText !== targetTitle)
          context.report(`Link text '${linkText}' should be '${targetTitle}'`);
        break;
      }
      case "xref":
        break;
    }
  }
}

Object.defineProperty(rule, "name", { value: "see-also" });

rule.appliesTo = () => "all";
