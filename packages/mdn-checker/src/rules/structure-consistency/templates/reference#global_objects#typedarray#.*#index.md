---
title: TypedArray.prototype.~topic~()
slug: Web/JavaScript/Reference/Global_Objects/TypedArray/~topic~
page-type: javascript-instance-method
browser-compat: javascript.builtins.TypedArray.~topic~
---

```js setup
if (context.frontMatter["page-type"] !== "javascript-instance-method")
  throw skip;
export const topic = context.frontMatter.title
  .replace("TypedArray.prototype.", "")
  .replace("()", "");
const arrayCounterpart = context.getFile(`reference/global_objects/array/${topic.toLowerCase()}`);
if (!arrayCounterpart) throw skip;
function adaptToTA(text) {
  if (!text) return text;
  return text
    .replaceAll("Array", "TypedArray")
    .replaceAll("array", "typed array")
    .replaceAll("an typed array", "a typed array")
    .replaceAll(/TypedArray(?=#iterative_methods|#copying_methods_and_mutating_methods)/gu, "Array")
    .replaceAll("`typed array`", "`array`")
    .replaceAll("typed array iterator", "array iterator")
    .replaceAll("typed array[", "array[")
    .replaceAll("typed array.length", "array.length")
    .replaceAll("or a typed array of", "or an array of")
    .replaceAll("[shallow copy](/en-US/docs/Glossary/Shallow_copy)", "copy")
    .replaceAll("converted to strings, then sorted according to each character's Unicode code point value", "sorted according to numeric value")
    .replaceAll(" Note all elements in the typed array will be this exact value: if `value` is an object, each slot in the typed array will reference that object.", "")
    .replaceAll(" The default sort order is ascending, built upon converting the elements into strings, then comparing their sequences of UTF-16 code units values.", "")
    .replaceAll(/(?<=An object with configuration properties\. ).*/gu, "See {{jsxref(\"Number.prototype.toLocaleString()\")}}.");
}
export const desc = adaptToTA(arrayCounterpart.getDescription());
const syntaxSec = arrayCounterpart.tree.getSubsection("Syntax");
export const arraySyntax = arrayCounterpart.getSource(syntaxSec.ast[0]);
const paramsList = syntaxSec.getSubsection("Parameters").ast[0];
const linesToKeep = [0];
for (const t of paramsList.children) {
  if (t.type === "dd") {
    for (const p of t.children) {
      if (p.type === "list") {
        linesToKeep.push(
          p.position.start.line - paramsList.position.start.line,
          p.position.end.line - paramsList.position.start.line + 1,
        );
      }
    }
  }
}
const paramsLines = arrayCounterpart.getSource(paramsList).split("\n");
export let params = "";
for (let i = 0; i < linesToKeep.length; i += 2)
  params +=
    paramsLines.slice(linesToKeep[i], linesToKeep[i + 1]).join("\n") + "\n";
params = adaptToTA(params);
export const returnValue = adaptToTA(syntaxSec.getSubsection("Return value").toString());
export const exceptions = adaptToTA(syntaxSec.getSubsection("Exceptions")?.toString());
export const examples = context.tree.getSubsection("Examples").toString();
const arraySeeAlso = arrayCounterpart.tree.getSubsection("See also").toString();
const polyfillLink =
  {
    __proto__: null,
    at: "relative-indexing-method",
    findLast: "array-find-from-last",
    findLastIndex: "array-find-from-last",
    toReversed: "change-array-by-copy",
    toSorted: "change-array-by-copy",
    with: "change-array-by-copy",
  }[topic] ?? "ecmascript-typed-arrays";
export const seeAlso = arraySeeAlso
  .split("\n")
  .filter((line) => {
    // cSpell:ignore tolocalestring
    if (context.path.includes("/tolocalestring/") && /(?<!(?:Number|Array)\.prototype\.)toLocaleString/u.test(line))
      return false;
    if (context.path.includes("/sort/") && /https:\/\/(?!.*core-js)|String.prototype.localeCompare/u.test(line))
      return false;
    const referencedMethod = line.match(
      /\{\{jsxref\("Array\.prototype\.(?<name>\w+)\(\)"\)\}\}/u,
    )?.groups?.name;
    if (!referencedMethod) return true;
    return context.getFile(
      `reference/global_objects/typedarray/${referencedMethod.toLowerCase()}`,
    );
  })
  .map((line) => {
    if (line.startsWith("- [Polyfill of"))
      return `- [Polyfill of \`TypedArray.prototype.${topic}\`${topic === "sort" ? " with modern behavior like stable sort" : ""} in \`core-js\`](https://github.com/zloirock/core-js#${polyfillLink})`;
    if (line.startsWith("- [Indexed collections]"))
      return "- [JavaScript typed arrays](/en-US/docs/Web/JavaScript/Guide/Typed_arrays) guide";
    return line
      .replaceAll("TypedArray", "[TA]")
      .replaceAll("Array", "TypedArray")
      .replaceAll("[TA]", "Array");
  })
  .join("\n");
export const isShorter = [
  "fill",
  "map",
  "reverse",
  "slice",
  "sort",
  "toString",
].includes(topic);
```

{{JSRef}}

~desc~ This method has the same algorithm as {{jsxref("Array.prototype.~topic~()")}}~["sort", "toSorted"].includes(topic) ? ", except that it sorts the values numerically instead of as strings by default" : ""~.

{{EmbedInteractiveExample("pages/js/typedarray-~topic.toLowerCase()~.html"~isShorter ? ', "shorter"' : ""~)}}

## Syntax

~arraySyntax~

### Parameters

~params~

### Return value

~returnValue~~exceptions ? `

### Exceptions

${exceptions}` : "" /*This tricks the syntax highlight: $*/~

## Description

See {{jsxref("Array.prototype.~topic~()")}} for more details. This method is not generic and can only be called on typed array instances.

## Examples

~examples~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

~seeAlso~
