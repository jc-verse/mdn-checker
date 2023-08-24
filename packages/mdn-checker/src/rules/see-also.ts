import type { List } from "mdast";
import type { Context } from "../context.js";

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

export default function rule(context: Context): void {
  let seeAlsoSection = context.tree.getSubsection("See also")?.ast;
  if (!seeAlsoSection) return;
  if (
    seeAlsoSection.length === 2 &&
    /\{\{PreviousNext\(.*\)\}\}/u.test(context.getSource(seeAlsoSection[1]!))
  )
    seeAlsoSection = seeAlsoSection.slice(0, 1);
  if (seeAlsoSection.length !== 1 && seeAlsoSection[0]!.type !== "list")
    context.report("See also section must be a single list");
  type SeeAlsoItem =
    | { type: "link-internal"; text: string; url: string }
    | { type: "link-external"; text: string; url: string; extra: string }
    | { type: "polyfill"; text: string; url: string }
    | { type: "xref"; text: string }
    | { type: "invalid"; message: string };
  const items = (seeAlsoSection[0] as List).children.map(
    (item): SeeAlsoItem => {
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
          case "text":
            if (
              !/^\{\{(?:domxref|HTTPHeader|HTMLElement|Glossary|jsxref)\(.*\)\}\}$/iu.test(
                link.value,
              )
            ) {
              return {
                type: "invalid",
                message: `Non-link item must be an xref: ${link.value}`,
              };
            }
            return { type: "xref", text: link.value };
          default:
            return {
              type: "invalid",
              message: `'${context.getSource(
                link,
              )}' must be either a link or an xref`,
            };
        }
      } else if (
        p.children.length !== 2 ||
        p.children[0]?.type !== "link" ||
        p.children[1]?.type !== "text"
      ) {
        return {
          type: "invalid",
          message: `'${context.getSource(
            p,
          )}' should be in the format '[link]() on/by ...'`,
        };
      } else {
        const link = p.children[0]!;
        const text = p.children[1]!;
        if (linkIsInternal(link.url)) {
          return {
            type: "invalid",
            message: `Internal link '${context.getSource(
              link,
            )}' cannot have extra text`,
          };
        }
        return {
          type: "link-external",
          text: context.getSource(link.children),
          url: link.url,
          extra: context.getSource(text).trim(),
        };
      }
    },
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
    }
  }
}

Object.defineProperty(rule, "name", { value: "see-also" });

rule.appliesTo = () => "all";
