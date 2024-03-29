---
title: ~cls~
slug: Web/JavaScript/Reference/Global_Objects/~cls~
page-type: javascript-class~nonStandardNote[0]~
browser-compat: javascript.builtins.~cls~
---

```js setup
export const cls = context.frontMatter.title;
export const isSerializable = !["AggregateError", "InternalError"].includes(
  cls,
);
export const article = /^[aeiou]/iu.test(cls) ? "an" : "a";
export const intro = context
  // Remove front matter + sidebar
  .getSource(context.tree.intro.slice(2))
  .replace(/^\{\{JSRef\}\}.*/mu, "")
  .replace(/^`\w+` is a \{\{Glossary\("serializable object"\)\}\}.*/mu, "")
  .replace(/^`\w+` is a subclass of \{\{jsxref\("Error"\)\}\}\./mu, "");
export const nonStandardNote =
  cls === "InternalError"
    ? [
        "\nstatus:\n  - non-standard",
        "{{Non-standard_Header}}",
        " {{non-standard_inline}}",
      ]
    : ["", "", ""];
export const polyfillLink =
  cls === "AggregateError"
    ? "- [Polyfill of `AggregateError` in `core-js`](https://github.com/zloirock/core-js#ecmascript-promise)"
    : "";
export const examples = context.tree.getSubsection("Examples");
export const seeAlso = `${context.tree.getSubsection("See also")}`
  .replace(/^- \[Polyfill of.*\n?/mu, "")
  .replace(/^- \{\{jsxref\("Error"\)\}\}\n?/mu, "")
  .trim();
```

{{JSRef}}~nonStandardNote[1]~

~intro~

~isSerializable ? `\`${cls}\` is a {{Glossary("serializable object")}}, so it can be cloned with {{domxref("structuredClone()")}} or copied between [Workers](/en-US/docs/Web/API/Worker) using {{domxref("Worker/postMessage()", "postMessage()")}}.` : ""~

`~cls~` is a subclass of {{jsxref("Error")}}.

## Constructor

- {{jsxref("~cls~/~cls~", "~cls~()")}}~nonStandardNote[2]~
  - : Creates a new `~cls~` object.

## Instance properties

_Also inherits instance properties from its parent {{jsxref("Error")}}_.

These properties are defined on `~cls~.prototype` and shared by all `~cls~` instances.

- {{jsxref("Object/constructor", "~cls~.prototype.constructor")}}
  - : The constructor function that created the instance object. For `~cls~` instances, the initial value is the {{jsxref("~cls~/~cls~", "~cls~")}} constructor.
- {{jsxref("Error/name", "~cls~.prototype.name")}}
  - : Represents the name for the type of error. For `~cls~.prototype.name`, the initial value is `"~cls~"`.

~cls === "AggregateError" ? `These properties are own properties of each \`AggregateError\` instance.

- {{jsxref("AggregateError/errors", "errors")}}
  - : An array representing the errors that were aggregated.` : ""~

## Instance methods

_Inherits instance methods from its parent {{jsxref("Error")}}_.

## Examples

~examples~

## Specifications

~cls === "InternalError" ? "Not part of any standard." : "{{Specifications}}"~

## Browser compatibility

{{Compat}}

## See also

~polyfillLink~
- {{jsxref("Error")}}
~seeAlso~
