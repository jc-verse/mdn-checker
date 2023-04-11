import Path from "node:path";
import { interpolate, escapeRegExp, toEnglish } from "../utils.js";
import { toJSxRef } from "../serializer/toJSxRef.js";
import primitives from "../data/primitives.js";
import type { Context } from "../index.js";

const patterns: [(ctx: Context) => unknown, string][] = [
  // Static accessor properties
  [
    (ctx) => /(?:map|set)\/@@species/.test(ctx.path),
    escapeRegExp`${"^"}The **\`~title~\`** static accessor property is an unused accessor property specifying how to copy \`~cls~\` objects.${"$"}`,
  ],
  [
    (ctx) => ctx.path.includes("@@species"),
    // eslint-disable-next-line no-template-curly-in-string
    escapeRegExp`${"^"}The **\`~title~\`** static accessor property returns the constructor used to construct ~${"cls === 'RegExp' ? 'copied regular expressions in certain `RegExp` methods' : `return values from ${enCls} methods`"}~.${"$"}`,
  ],
  [
    (ctx) => {
      const res = /(?<base>.+) \((?<alias>\$.)\)/.exec(ctx.frontMatter.title);
      if (!res) return false;
      const { base, alias } = res.groups!;
      return {
        base,
        aliasedName: escapeRegExp(
          alias === "$_"
            ? "`RegExp.$_`"
            : alias === "$`"
            ? '`` RegExp["$`"] ``'
            : `\`RegExp["${alias}"]\``,
        ),
      };
    },
    escapeRegExp`${"^"}The **\`~base~\`** static accessor property returns ${".*?"}. ~aliasedName~ is an alias for this property.${"$"}`,
  ],
  [
    (ctx) => ctx.path.includes("regexp/n"),
    escapeRegExp`${"^"}The **\`~title~\`** static accessor properties return`,
  ],
  [
    (ctx) =>
      ctx.frontMatter["page-type"] === "javascript-static-accessor-property",
    escapeRegExp`${"^"}The **\`~title~\`** static accessor property returns`,
  ],
  // Static data properties
  [
    (ctx) => {
      if (ctx.frontMatter.slug.split("/").at(-2) !== "Symbol") return false;
      const name = ctx.frontMatter.slug.split("/").at(-1);
      if (typeof Symbol[name as keyof typeof Symbol] !== "symbol") return false;
      return { symbolName: name };
    },
    escapeRegExp`${"^"}The **\`~title~\`** static data property represents the [well-known symbol](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#well-known_symbols) \`@@~symbolName~\`.`,
  ],
  [
    (ctx) => ctx.frontMatter["page-type"] === "javascript-static-data-property",
    escapeRegExp`${"^"}The **\`~title~\`** static data property represents`,
  ],
  // Static methods
  [
    (ctx) => ctx.frontMatter["page-type"] === "javascript-static-method",
    escapeRegExp`${"^"}The **\`~title~\`** static method`,
  ],
  // Instance accessor properties
  [
    (ctx) => ctx.path.includes("/buffer/"),
    escapeRegExp`${"^"}The **\`buffer\`** accessor property of ~clsRef~ instances returns the {{jsxref("ArrayBuffer")}} or {{jsxref("SharedArrayBuffer")}} referenced by this ~enCls~ at construction time.${"$"}`,
  ],
  [
    (ctx) => ctx.path.includes("/bytelength/"),
    escapeRegExp`${"^"}The **\`byteLength\`** accessor property of ~clsRef~ instances returns the length (in bytes) of this ~enCls~.${"$"}`,
  ],
  [
    // cSpell:ignore maxbytelength
    (ctx) => ctx.path.includes("/maxbytelength/"),
    escapeRegExp`${"^"}The **\`maxByteLength\`** accessor property of ~clsRef~ instances returns the maximum length (in bytes) that this ~enCls~ can be ~${"cls === 'ArrayBuffer' ? 'resized' : 'grown'"}~ to.${"$"}`,
  ],
  [
    (ctx) => ctx.path.includes("/byteoffset/"),
    escapeRegExp`${"^"}The **\`byteOffset\`** accessor property of ~clsRef~ instances returns the offset (in bytes) of this ~enCls~ from the start of its {{jsxref("ArrayBuffer")}} or {{jsxref("SharedArrayBuffer")}}.${"$"}`,
  ],
  [
    (ctx) => {
      const name =
        /RegExp\/(?<name>dotAll|global|hasIndices|ignoreCase|multiline|sticky|unicode)/.exec(
          ctx.frontMatter.slug,
        )?.groups!.name;
      if (!name) return false;
      const flag = {
        dotAll: "s",
        global: "g",
        hasIndices: "d",
        ignoreCase: "i",
        multiline: "m",
        sticky: "y",
        unicode: "u",
      }[name];
      return { name, flag };
    },
    escapeRegExp`${"^"}The **\`~name~\`** accessor property of ~clsRef~ instances returns whether or not the \`~flag~\` flag is used with this regular expression.${"$"}`,
  ],
  [
    (ctx) =>
      ctx.frontMatter["page-type"] === "javascript-instance-accessor-property",
    escapeRegExp`${"^"}The **\`~${"title.split('.').at(-1)"}~\`** accessor property of ~clsRef~ ~${"isPrimitive ? 'values' : 'instances'"}~ returns ${".*?"} this ~enCls~`,
  ],
  // Instance data properties
  [
    (ctx) => ctx.path.includes("/displayname/"),
    // cSpell:ignore aeiou
    escapeRegExp`${"^"}The optional **\`displayName\`** property of a ~clsRef~ instance`,
  ],
  [
    (ctx) => {
      if (ctx.frontMatter["page-type"] !== "javascript-instance-data-property")
        return false;
      const propertyName = /[a-z]+: (?<name>[a-z]+)/i.exec(
        ctx.frontMatter.title,
      )?.groups!.name;
      if (!propertyName) return false;
      return { propertyName };
    },
    // cSpell:ignore aeiou
    escapeRegExp`${"^"}The **\`~propertyName~\`** data property of ~${"/^[aeiou]/i.test(cls) ? 'an' : 'a'"}~ ~clsRef~ ~${"isPrimitive ? 'value' : 'instance'"}~`,
  ],
  // Instance methods
  [
    (ctx) => ctx.path.includes("@@iterator"),
    escapeRegExp`${"^"}The **\`[@@iterator]()\`** method of ~clsRef~ ~${"cls === 'arguments' ? 'objects' : isPrimitive ? 'values' : 'instances'"}~ implements the [iterable protocol](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) and allows ~${"cls === 'Iterator' ? 'built-in iterator' : enCls"}~~${"enCls.endsWith('`') ? ' objects' : 's'"}~ to be consumed by most syntaxes expecting iterables, such as the [spread syntax](/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) and {{jsxref("Statements/for...of", "for...of")}} loops. It returns ${".*"}.${"$"}`,
  ],
];

export default function rule(context: Context): void {
  let extraParams = null as unknown;
  const descriptionPattern = patterns.find(
    ([cond]) => (extraParams = cond(context)),
  )?.[1];
  if (!descriptionPattern) return;
  const segments = context.frontMatter.slug.split("/");
  const cls =
    segments.at(-3) === "Intl"
      ? `${segments.at(-3)!}.${segments.at(-2)!}`
      : segments.at(-2)!;
  const isPrimitive = primitives.includes(cls);
  const clsRef = escapeRegExp(
    toJSxRef(
      context.getFile(Path.dirname(Path.dirname(context.path)))!.frontMatter,
    ),
  );
  const re = new RegExp(
    interpolate(descriptionPattern, {
      title: escapeRegExp(context.frontMatter.title),
      cls,
      enCls: toEnglish(cls),
      isPrimitive,
      escapeRegExp,
      clsRef,
      // Who said only objects can be spread?
      ...(extraParams as object),
    }),
  );
  const description = context.getDescription();
  if (!re.test(description))
    context.report(`Description does not match pattern: ${re}`);
}

rule.appliesTo = () => "all";
