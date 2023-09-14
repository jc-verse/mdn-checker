---
title: String.prototype.~topic~()
slug: Web/JavaScript/Reference/Global_Objects/String/~topic~
page-type: javascript-instance-method
status:
  - deprecated
browser-compat: javascript.builtins.String.~topic~
---

```js setup
export const topic = context.frontMatter.title.replace("String.prototype.", "").replace("()", "");
export const tagName = {
  anchor: "a",
  bold: "b",
  fixed: "tt",
  fontcolor: "font",
  fontsize: "font",
  italics: "i",
  link: "a",
}[topic] ?? topic;
export const article = /^[aeiou]/u.test(tagName) ? "an" : "a";
const effectBase = {
  big: "in a big font",
  bold: "as bold",
  fixed: "in a fixed-width font",
  fontcolor: "in the specified font color",
  fontsize: "in the specified font size",
  italics: "as italic",
  small: "in a small font",
  strike: "as struck-out text",
  sub: "as subscript",
  sup: "as superscript",
}[topic];
export const effect = {
  anchor: "",
  blink: ", which used to cause a string to blink in old browsers",
  link: ", to be used as a hypertext link to another URL",
}[topic] ?? `, which causes this string to be displayed ${effectBase}`;
export let migrationTip = "Use [DOM APIs](/en-US/docs/Web/API/Document_Object_Model) such as [`document.createElement()`](/en-US/docs/Web/API/Document/createElement) instead.";
export let invalid = "";
if (topic === "anchor") {
  migrationTip +=
    "\n>\n> The HTML specification no longer allows the {{HTMLElement(\"a\")}} element to have a `name` attribute, so this method doesn't even create valid markup.";
  invalid = '`name` is no longer a valid attribute of the {{HTMLElement("a")}} element';
} else if (["big", "fixed", "fontcolor", "fontsize", "strike"].includes(topic)) {
  migrationTip = `For the case of \`${topic}()\`, the \`<${tagName}>\` element itself has been removed from the HTML specification and shouldn't be used anymore. Web developers should use ${topic === "strike" ? 'the {{HTMLElement("del")}} for deleted content or the {{HTMLElement("s")}} for content that is no longer accurate or no longer relevant' : "[CSS](/en-US/docs/Web/CSS) properties"} instead.`;
  invalid = `\`${tagName}\` is no longer a valid element`;
} else if (topic === "blink") {
  migrationTip = "For the case of `blink()`, the `<blink>` element itself is removed from modern browsers, and blinking text is frowned upon by several accessibility standards. Avoid using the element in any way.";
  invalid = "`blink` is no longer a valid element";
}
export let description = context.tree.getSubsection("Description", { withTitle: true }) ?? "";
if (description) description = `\n${description}\n`;
export const attr = {
  anchor: "name",
  fontcolor: "color",
  fontsize: "size",
  link: "href",
}[topic] ?? "";
export const param = attr === "href" ? "url" : attr;
export const exampleArg = {
  anchor: '"hello"',
  fontcolor: '"red"',
  fontsize: "7",
  link: '"https://developer.mozilla.org/"',
}[topic] ?? "";
export const paramDesc = param ? context.getSource(context.tree.getSubsection("Syntax").getSubsection("Parameters").ast[0].children[1].children[0]) : "";
export const contentString = topic === "link" ? "MDN Web Docs" : "Hello, world";

export const replacement = [`> **Warning:** This markup is invalid, because ${invalid}.\n\n`, `Instead of using \`${topic}()\` and creating HTML text directly, you should use `, `DOM APIs such as [\`document.createElement()\`](/en-US/docs/Web/API/Document/createElement). For example:

\`\`\`js
const contentString = "${contentString}";
const elem = document.createElement("${tagName === "strike" ? "s" : tagName}");${topic === "link" ? `\nelem.href = "https://developer.mozilla.org/";` : ""}
elem.innerText = contentString;
document.body.appendChild(elem);
\`\`\``];
if (!invalid) replacement[0] = "";
if (topic === "blink") {
  replacement[1] = "You should avoid blinking elements altogether.";
  replacement[2] = "";
} else if (["big", "fixed", "fontcolor", "fontsize"].includes(topic)) {
  const cssProp = {
    big: "font-size",
    fixed: "font-family",
    fontcolor: "color",
    fontsize: "font-size",
  }[topic];
  replacement[2] = `CSS to manipulate fonts. For example, you can manipulate {{cssxref("${cssProp}")}} through the {{domxref("HTMLElement/style", "element.style")}} attribute:

\`\`\`js
document.getElementById("yourElemId").style.${cssProp.replace(/-([a-z])/, (m, p1) => p1.toUpperCase())} = "${{
  big: "2em",
  fixed: "monospace",
  fontcolor: "red",
  fontsize: "7pt",
}[topic]}";
\`\`\``;
}
```

{{JSRef}} {{Deprecated_Header}}

The **`~topic~()`** method of {{jsxref("String")}} values creates a string that embeds this string in ~article~ ~tagName === "blink" ? "`<blink>`" : `{{HTMLElement("${tagName}")}}`~ element~topic === "anchor" ? " with a name" : ""~ (`<~tagName~~attr ? ` ${attr}="..."` : ""~>str</~tagName~>`)~effect~.

> **Note:** All [HTML wrapper methods](/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#html_wrapper_methods) are deprecated and only standardized for compatibility purposes. ~migrationTip~

## Syntax

```js-nolint
~topic~(~param~)
```

### Parameters

~attr ? `
- \`${param}\`
  - ${paramDesc}
` : "None."~

### Return value

A string beginning with ~article~ `<~tagName~~attr ? ` ${attr}="${attr === "href" ? "url" : attr}"` : ""~>` start tag~attr ? ` (double quotes in \`${param}\` are replaced with \`&quot;\`)` : ""~, then the text `str`, and then ~article~ `</~tagName~>` end tag.
~description~
## Examples

### Using ~topic~()

The code below creates an HTML string and then replaces the document's body with it:

```js
const contentString = "~contentString~";

document.body.innerHTML = contentString.~topic~(~exampleArg~);
```

This will create the following HTML:

```html
<~tagName~~attr ? ` ${attr}=${exampleArg.startsWith('"') ? exampleArg : `"${exampleArg}"`}` : ""~>~contentString~</~tagName~>
```

~replacement.join("")~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [Polyfill of `String.prototype.~topic~` in `core-js`](https://github.com/zloirock/core-js#ecmascript-string-and-regexp)
- [HTML wrapper methods](/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#html_wrapper_methods)
~tagName === "blink" ? "" : `- {{HTMLElement("${tagName}")}}`~
