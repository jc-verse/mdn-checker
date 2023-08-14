---
title: ~upperCaseName~ (~operator~)
slug: Web/JavaScript/Reference/Operators/~upperCaseName.replaceAll(" ", "_")~
page-type: javascript-operator
browser-compat: javascript.operators.~name.toLowerCase().replaceAll(" ", "_")~
---

```js setup
export const [, upperCaseName, operator] = context.frontMatter.title.match(/(.*) \((.*)\)/);
export const name = upperCaseName[0].toLowerCase() + upperCaseName.slice(1);
export const counterpart = name.replace(" assignment", "");
export const upperCaseCounterpart = upperCaseName.replace(" assignment", "");
export const condition = {
  "&&=": "truthy",
  "||=": "falsy",
  "??=": "nullish",
}[operator];
const children = context.ast.children;
const headings = children.filter(
  (node) => node.type === "heading" && [2, 3].includes(node.depth),
);
const examplesHeading = children.findIndex(
  (node) => node.type === "heading" && node.children[0].value === "Examples",
);
const specificationsHeading = children.findIndex(
  (node) => node.type === "heading" && node.children[0].value === "Specifications",
);
const seeAlsoHeading = children.findIndex(
  (node) => node.type === "heading" && node.children[0].value === "See also",
);
export const examples = context
  .getSource(children.slice(examplesHeading + 1, specificationsHeading))
  .trim();
export const seeAlso = context
  .getSource(children.slice(seeAlsoHeading + 1))
  .replace(/^- \[Assignment operators in the JS guide.*\n?/mu, "")
  .replace(new RegExp(`- \\[${upperCaseCounterpart}.*\\n?`, "mu"), "")
  .trim();
```

{{jsSidebar("Operators")}}

The **~name~ (`~operator~`)** operator~operator === "??=" ? ", also known as the **logical nullish assignment** operator," : ""~ only evaluates the right operand and assigns to the left if the left operand is {{Glossary("~condition~")}}~condition === "nullish" ? " (`null` or `undefined`)" : ""~.

{{EmbedInteractiveExample("pages/js/expressions-~name.replaceAll(" ", "-").toLowerCase()~.html")}}

## Syntax

```js-nolint
x ~operator~ y
```

## Description

~upperCaseName~ [_short-circuits_](/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence#short-circuiting), meaning that `x ~operator~ y` is equivalent to:

```js
x ~operator.replace("=", "")~ (x = y);
```

No assignment is performed if the left-hand side is not ~condition~, due to short-circuiting of the [~counterpart~](/en-US/docs/Web/JavaScript/Reference/Operators/~upperCaseCounterpart.replaceAll(" ", "_")~) operator. For example, the following does not throw an error, despite `x` being `const`:

```js
const x = ~condition === "truthy" ? 0 : 1~;
x ~operator~ 2;
```

Neither would the following trigger the setter:

```js
const x = {
  get value() {
    return ~condition === "truthy" ? 0 : 1~;
  },
  set value(v) {
    console.log("Setter called");
  },
};

x.value ~operator~ 2;
```

In fact, if `x` is not ~condition~, `y` is not evaluated at all.

```js
const x = ~condition === "truthy" ? 0 : 1~;
x ~operator~ console.log("y evaluated");
// Logs nothing
```

## Examples

~examples~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [~upperCaseCounterpart === "Nullish coalescing" ? "Nullish coalescing operator" : upperCaseCounterpart~ (`~operator.replace("=", "")~`)](/en-US/docs/Web/JavaScript/Reference/Operators/~upperCaseCounterpart.replace(" ", "_")~)
~seeAlso~
