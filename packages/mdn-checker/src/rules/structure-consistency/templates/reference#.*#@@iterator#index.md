---
title: ~titleCls~[@@iterator]()
slug: Web/JavaScript/Reference/~slug~/@@iterator
page-type: javascript-instance-method
browser-compat: javascript.~bcdKey~.@@iterator
---

```js setup
export const cls = context.frontMatter.title
  .replace("[@@iterator]()", "")
  .replace(".prototype", "");
export const titleCls = cls === "arguments" ? cls : `${cls}.prototype`;
export const slug =
  cls === "Segments"
    ? "Global_Objects/Intl/Segmenter/segment/Segments"
    : cls === "arguments"
    ? "Functions/arguments"
    : `Global_Objects/${cls}`;
export const bcdKey =
  cls === "Segments"
    ? "builtins.Intl.Segments"
    : cls === "arguments"
    ? "functions.arguments"
    : `builtins.${cls}`;
export const clsRef =
  cls === "Segments"
    ? "[`Segments`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment/Segments) instances"
    : cls === "arguments"
    ? '{{jsxref("Functions/arguments", "arguments")}} objects'
    : `{{jsxref("${cls}")}} ${cls === "String" ? "values" : "instances"}`;
export const enClsPl = {
  arguments: "`arguments` objects",
  Array: "arrays",
  TypedArray: "typed arrays",
  Map: "`Map` objects",
  Set: "`Set` objects",
  Iterator: "built-in iterators",
  String: "strings",
  Segments: "`Segments` objects",
}[cls];
export const alias =
  {
    arguments: "Array.prototype.values",
    Array: "Array.prototype.values",
    Map: "Map.prototype.entries",
    Set: "Set.prototype.values",
    TypedArray: "TypedArray.prototype.values",
  }[cls] ?? "";
const resultType = {
  arguments: "the value of each index in the `arguments` object",
  Array: "the value of each index in the array",
  TypedArray: "the value of each index in the typed array",
  Map: "the key-value pairs of the map",
  Set: "the values of the set",
  String: "the Unicode code points of the string value as individual strings",
  Segments: "data about each segment",
}[cls];
export const iteratorType = {
  arguments: "array iterator",
  Array: "array iterator",
  TypedArray: "array iterator",
  Map: "map iterator",
  Set: "set iterator",
  String: "string iterator",
  Segments: "segments iterator",
}[cls];
export const iteratorDesc =
  cls === "Iterator"
    ? "the value of [`this`](/en-US/docs/Web/JavaScript/Reference/Operators/this), which is the iterator object itself"
    : `${
        iteratorType.startsWith("a") ? "an" : "a"
      } [${iteratorType} object](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) that yields ${resultType}`;
export const hasInteractiveExample = [
  "Array",
  "Segments",
  "Map",
  "Set",
  "String",
  "TypedArray",
].includes(cls);
export const description =
  context.tree.getSubsection("Description", { withTitle: true }) ?? "";
const examplesNode = context.tree.getSubsection("Examples");
export const example1 = `${examplesNode.getSubsection(0)}`.replace(
  /^Note that.*\n/mu,
  "",
);
// Iterator has no "Manually hand-rolling the iterator" example because it's
// just the iterator itself.
export const example2 =
  cls === "Iterator"
    ? ""
    : `${examplesNode.getSubsection(1)}`.replace(/^You may still.*\n/mu, "");
export const example3 =
  examplesNode.getSubsection(2, { withTitle: true }) ?? "";
export const seeAlso = `${context.tree.getSubsection("See also")}`
  .replace(/^- \[Polyfill of.*\n?/mu, "")
  .replace(/^- \{\{jsxref\("Symbol\.iterator"\)\}\}\n?/mu, "")
  .replace(/^- \[Iteration protocols.*\n?/mu, "")
  .trim();
const coreJSsection = {
  Array: "array",
  String: "string-and-regexp",
  TypedArray: "typed-arrays",
}[cls];
export const polyfillLink = coreJSsection
  ? `- [Polyfill of \`${cls}.prototype[@@iterator]\` in \`core-js\`](https://github.com/zloirock/core-js#ecmascript-${coreJSsection})`
  : "";
```

~cls === "arguments" ? '{{jsSidebar("Functions")}}' : "{{JSRef}}"~

The **`[@@iterator]()`** method of ~clsRef~ implements the [iterable protocol](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) and allows ~enClsPl~ to be consumed by most syntaxes expecting iterables, such as the [spread syntax](/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) and {{jsxref("Statements/for...of", "for...of")}} loops. It returns ~iteratorDesc~~["Map", "Set"].includes(cls) ? " in insertion order" : ""~.

~alias && `The initial value of this property is the same function object as the initial value of the {{jsxref("${alias}")}} property` + (cls === "arguments" ? " (and also the same as [`Array.prototype[@@iterator]`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/@@iterator))." : ".")~

~hasInteractiveExample ? `
{{EmbedInteractiveExample("pages/js/${cls.toLowerCase()}-prototype-@@iterator.html")}}
` : ""~

## Syntax

```js-nolint
~cls[0].toLowerCase() + cls.slice(1)~[Symbol.iterator]()
```

### Return value

~(alias ? `The same return value as {{jsxref("${alias}()")}}: ${iteratorDesc}` : iteratorDesc[0].toUpperCase() + iteratorDesc.slice(1)).replace(new RegExp(`(a)n? \\[${iteratorType}`, "i"), "$1 new [iterable iterator")~.~cls === "Segments" ? " Each yielded object has the same properties as the object returned by the [`containing()`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment/Segments/containing) method." : ""~

~description~

## Examples

### Iteration using for...of loop

Note that you seldom need to call this method directly. The existence of the `@@iterator` method makes ~enClsPl~ [iterable](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol), and iterating syntaxes like the `for...of` loop automatically call this method to obtain the iterator to loop over.

~example1~

~cls === "Iterator" ? "" : `

### Manually hand-rolling the iterator

You may still manually call the \`next()\` method of the returned iterator object to achieve maximum control over the iteration process.

` + example2~

~example3~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

~polyfillLink~
~seeAlso~
- {{jsxref("Symbol.iterator")}}
- [Iteration protocols](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
