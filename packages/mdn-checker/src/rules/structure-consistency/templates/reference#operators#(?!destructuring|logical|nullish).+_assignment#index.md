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
export const isShorter = ["&=", "|=", "^=", "<<="].includes(operator);
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
export const example = context
  .getSource(children.slice(examplesHeading + 2, specificationsHeading))
  .trim();
export const seeAlso = context
  .getSource(children.slice(seeAlsoHeading + 1))
  .replace(/^- \[Assignment operators in the JS guide.*\n?/mu, "")
  .replace(new RegExp(`- \\[${upperCaseCounterpart}.*\\n?`, "mu"), "")
  .trim();
```

{{jsSidebar("Operators")}}

The **~name~ (`~operator~`)** operator performs [~counterpart~](/en-US/docs/Web/JavaScript/Reference/Operators/~upperCaseCounterpart.replaceAll(" ", "_")~) ~operator === "+=" ? "(which is either numeric addition or string concatenation) " : ""~on the two operands and assigns the result to the left operand.

{{EmbedInteractiveExample("pages/js/expressions-~name.replaceAll(" ", "-").toLowerCase()~.html"~isShorter ? ', "shorter"' : ""~)}}

## Syntax

```js-nolint
x ~operator~ y
```

## Description

`x ~operator~ y` is equivalent to `x = x ~operator.replace("=", "")~ y`.

## Examples

### Using ~name~

~example~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [Assignment operators in the JS guide](/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators#assignment_operators)
- [~upperCaseCounterpart~ (`~operator.replace("=", "")~`)](/en-US/docs/Web/JavaScript/Reference/Operators/~upperCaseCounterpart.replaceAll(" ", "_")~)
~seeAlso~
