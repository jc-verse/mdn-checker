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
export const opName = name.replace("bitwise ", "");
export const isShorter = ["&", "^", "|"].includes(operator);
export const isUnary = operator === "~";
export const condition = {
  "&": "both",
  "|": "either or both",
  "^": "either but not both",
}[operator];
export const truncMethod = {
  "&": ["with `-1`", "& -1"],
  "|": ["with `0`", "| 0"],
  "^": ["with `0`", "^ 0"],
  "~": ["twice", "~~x"],
}[operator];
export function toBinary(f, type = "Float64", sep = "") {
  const dv = new DataView(new ArrayBuffer(8));
  dv[`set${type}`](0, f);
  const ans = Array.from(
    { length: globalThis[`${type}Array`].BYTES_PER_ELEMENT },
    (_, i) => dv.getUint8(i).toString(2).padStart(8, "0"),
  );
  return ans.join(sep);
}
export const example = context.tree.getSubsection("Examples").getSubsection(0);
```

{{jsSidebar("Operators")}}

The **~name~ (`~operator~`)** operator returns a number or BigInt whose binary representation has a `1` in each bit position for which the corresponding ~isUnary ? "bit of the operand is `0`, and a `0` otherwise" : `bits of ${condition} operands are \`1\``~.

{{EmbedInteractiveExample("pages/js/expressions-bitwise-~opName.toLowerCase()~.html"~isShorter ? ', "shorter"' : ""~)}}

## Syntax

```js-nolint
~isUnary ? `${operator}x` : `x ${operator} y`~
```

## Description

The `~operator~` operator is overloaded for two types of operands: number and [BigInt](/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt). For numbers, the operator returns a 32-bit integer. For BigInts, the operator returns a BigInt. It first [coerces ~isUnary ? "the operand to a numeric value" : "both operands to numeric values"~](/en-US/docs/Web/JavaScript/Data_structures#numeric_coercion) and tests the ~isUnary ? "type of it" : "types of them"~. It performs BigInt ~opName~ if ~isUnary ? "the operand becomes a BigInt" : "both operands become BigInts"~; otherwise, it converts ~isUnary ? "the operand" : "both operands"~ to ~isUnary ? "a " : ""~[32-bit integer~isUnary ? "" : "s"~](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion) and performs number ~name~.~isUnary ? "" : ' A {{jsxref("TypeError")}} is thrown if one operand becomes a BigInt but the other becomes a number.'~

The operator operates on the operands' bit representations in [two's complement](https://en.wikipedia.org/wiki/Two's_complement). ~isUnary ? "" : "Each bit in the first operand is paired with the corresponding bit in the second operand: _first bit_ to _first bit_, _second bit_ to _second bit_, and so on. "~The operator is applied to each ~isUnary ? "bit" : "pair of bits"~, and the result is constructed bitwise.

The truth table for the ~opName~ operation is:

~isUnary ? `
| x   | ${opName} x |
| --- | ----- |
| 0   | 1     |
| 1   | 0     |
` : `
| x   | y   | x ${opName} y |
| --- | --- | ----${"-".repeat(opName.length)} |
| 0   | 0   | ${eval(`0 ${operator} 0`)}      |
| 0   | 1   | ${eval(`0 ${operator} 1`)}      |
| 1   | 0   | ${eval(`1 ${operator} 0`)}      |
| 1   | 1   | ${eval(`1 ${operator} 1`)}      |
`~

~isUnary ? `
\`\`\`plain
 9 (base 10) = 00000000000000000000000000001001 (base 2)
               --------------------------------
\~9 (base 10) = ${toBinary(eval(`${operator} 9`), "Int32")} (base 2) = ${eval(`${operator} 9`)} (base 10)
\`\`\`
` : `
\`\`\`plain
     9 (base 10) = 00000000000000000000000000001001 (base 2)
    14 (base 10) = 00000000000000000000000000001110 (base 2)
                   --------------------------------
14 ${operator} 9 (base 10) = ${toBinary(eval(`14 ${operator} 9`), "Int32")} (base 2) = ${eval(`14 ${operator} 9`)} (base 10)
\`\`\`
`~

Numbers with more than 32 bits get their most significant bits discarded. For example, the following integer with more than 32 bits will be converted to a 32-bit integer:

```plain
Before: 11100110111110100000000000000110000000000001
After:              10100000000000000110000000000001
```

For BigInts, there's no truncation. Conceptually, understand positive BigInts as having an infinite number of leading `0` bits, and negative BigInts having an infinite number of leading `1` bits.

~opName === "NOT" ? "Bitwise NOTing any 32-bit integer `x` yields `-(x + 1)`. For example, `\~-5` yields `4`." : ""~

Bitwise ~opName~ing any number `x` ~truncMethod[0]~ returns `x` converted to a 32-bit integer. Do not use `~truncMethod[1]~` to truncate numbers to integers; use [`Math.trunc()`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#using_bitwise_no-ops_to_truncate_numbers) instead.~opName === "NOT" ? " Due to using 32-bit representation for numbers, both `\~-1` and `\~4294967295` (2<sup>32</sup> - 1) result in `0`." : ""~

## Examples

### Using ~name~

~isUnary ? example : `
\`\`\`js
// 9  (00000000000000000000000000001001)
// 14 (00000000000000000000000000001110)

14 ${operator} 9;
// ${eval(`14 ${operator} 9`)} (${toBinary(eval(`14 ${operator} 9`), "Int32")})

14n ${operator} 9n; // ${eval(`14 ${operator} 9`)}n
\`\`\`
`~

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [Bitwise operators in the JS guide](/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators#bitwise_operators)
~isUnary ? "" : `- [${upperCaseName} assignment (\`${operator}=\`)](/en-US/docs/Web/JavaScript/Reference/Operators/${upperCaseName.replace(" ", "_")}_assignment)`~
