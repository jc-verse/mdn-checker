---
title: ~topic~ expression
slug: Web/JavaScript/Reference/Operators/~slug~
page-type: javascript-operator
browser-compat: javascript.operators.~slug.replace("function*", "generator_function")~
---

```js setup
export const topic = context.frontMatter.title.replace(" expression", "");
export const multipleKeywords = topic.includes(" ");
export const slug = topic.replace(" ", "_");
export const interactiveExample = {
  "async function": "",
  "async function*": '{{EmbedInteractiveExample("pages/js/expressions-async-function-asterisk.html", "taller")}}',
  "function": '{{EmbedInteractiveExample("pages/js/expressions-functionexpression.html", "shorter")}}',
  "function*": '{{EmbedInteractiveExample("pages/js/expressions-functionasteriskexpression.html", "taller")}}',
}[topic];
export const moreDescription = context.getSource(context.tree.getSubsection("Description").ast.slice(1));
export const examples = context.tree.getSubsection("Examples").toString().replace(/^### Using .*/u, "").trim();
export const functionType = {
  "async function": "async function",
  "async function*": "async generator function",
  "function": "function",
  "function*": "generator function",
  "class": "class",
}[topic];
export const article = topic.startsWith("a") ? ["An", "an"] : ["A", "a"];
export const iifeUse = {
  "async function": ", allowing you to mimic [top-level await](/en-US/docs/Web/JavaScript/Guide/Modules#top_level_await)",
  "async function*": ", allowing you to create an ad-hoc [async iterable object](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)",
  "function": "",
  "function*": ", allowing you to create an ad-hoc [iterable iterator object](/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol)",
}[topic];
export const extraSeeAlso = context.tree.getSubsection("See also").toString().split("\n").slice(4).join("\n");
```

{{jsSidebar("Operators")}}

The **`~topic~`** keyword~multipleKeywords ? "s" : ""~ can be used to define ~article[1]~ ~functionType~ inside an expression.

You can also define ~functionType~s using the [`~topic~` declaration](/en-US/docs/Web/JavaScript/Reference/Statements/~slug~)~topic.includes("*") ? "" : " or the [arrow syntax](/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)"~.

~interactiveExample~

## Syntax

```js-nolint
~topic~ (param0) {
  statements
}
~topic~ (param0, param1) {
  statements
}
~topic~ (param0, param1, /* …, */ paramN) {
  statements
}

~topic~ name(param0) {
  statements
}
~topic~ name(param0, param1) {
  statements
}
~topic~ name(param0, param1, /* …, */ paramN) {
  statements
}
```

> **Note:** An [expression statement](/en-US/docs/Web/JavaScript/Reference/Statements/Expression_statement) cannot begin with the keyword~multipleKeywords ? "s" : ""~ `~topic.replace("*", "")~` to avoid ambiguity with ~article[1]~ [`~topic~` declaration](/en-US/docs/Web/JavaScript/Reference/Statements/~slug~). The `~topic.replace("*", "")~` keyword~multipleKeywords ? "s" : ""~ only begin~multipleKeywords ? "" : "s"~ an expression when ~multipleKeywords ? "they appear" : "it appears"~ in a context that cannot accept statements.

### Parameters

- `name` {{optional_inline}}
  - : The function name. Can be omitted, in which case the function is _anonymous_. The name is only local to the function body.
- `paramN` {{optional_inline}}
  - : The name of a formal parameter for the function. For the parameters' syntax, see the [Functions reference](/en-US/docs/Web/JavaScript/Guide/Functions#function_parameters).
- `statements` {{optional_inline}}
  - : The statements which comprise the body of the function.

## Description

~article[0]~ `~topic~` expression is very similar to, and has almost the same syntax as, ~article[1]~ [`~topic~` declaration](/en-US/docs/Web/JavaScript/Reference/Statements/~slug~). The main difference between ~article[1]~ `~topic~` expression and ~article[1]~ `~topic~` declaration is the _function name_, which can be omitted in `~topic~` expressions to create _anonymous_ functions. ~article[0]~ `~topic~` expression can be used as an [IIFE](/en-US/docs/Glossary/IIFE) (Immediately Invoked Function Expression) which runs as soon as it is defined~iifeUse~. See also the chapter about [functions](/en-US/docs/Web/JavaScript/Reference/Functions) for more information.

~moreDescription~

## Examples

### Using ~topic.replace("*", "\\*")~ expression

~examples~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [Functions](/en-US/docs/Web/JavaScript/Guide/Functions) guide
- [Functions](/en-US/docs/Web/JavaScript/Reference/Functions)
- {{jsxref("Statements/~slug~", "~topic~")}}
- {{jsxref("~functionType.replace(/(?:^| )([a-z])/gu, (m, p1) => p1.toUpperCase())~")}}
~extraSeeAlso~
