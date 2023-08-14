---
title: ~cls~() constructor
slug: Web/JavaScript/Reference/Global_Objects/~cls~/~cls~
page-type: javascript-constructor
browser-compat: javascript.builtins.~cls~.~cls~
---

```js setup
export const cls = context.frontMatter.title.replace("() constructor", "");
export const name = cls.replace("Array", "").replace("Clamped", "c").toLowerCase();
export const article = cls.startsWith("Int") ? "an" : "a";
const literalSuffix = cls.includes("Big") ? "n" : "";
export const literal = (value) => `${value}${literalSuffix}`;
export const polyfillLink = cls.includes("Big")
  ? ""
  : `- [Polyfill of \`${cls}\` in \`core-js\`](https://github.com/zloirock/core-js#ecmascript-typed-arrays)`;
export const BYTES_PER_ELEMENT = cls.match(/\d+/)[0] / 8;
export const clampedExtraExample = cls.includes("Clamped")
  ? ["uint8c[1] = 1337;\n", "console.log(uint8c[1]); // 255 (clamped)\n"]
  : ["", ""];
```

{{JSRef}}

The **`~cls~()`** constructor creates {{jsxref("~cls~")}} objects. The contents are initialized to `~literal(0)~`.

## Syntax

```js-nolint
new ~cls~()
new ~cls~(length)
new ~cls~(typedArray)
new ~cls~(object)

new ~cls~(buffer)
new ~cls~(buffer, byteOffset)
new ~cls~(buffer, byteOffset, length)
```

> **Note:** `~cls~()` can only be constructed with [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to call it without `new` throws a {{jsxref("TypeError")}}.

### Parameters

See [`TypedArray`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#parameters).

### Exceptions

See [`TypedArray`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#exceptions).

## Examples

### Different ways to create ~article~ ~cls~

```js
// From a length
const ~name~ = new ~cls~(2);
~name~[0] = ~literal(42)~;
~clampedExtraExample[0]~console.log(~name~[0]); // ~literal(42)~
~clampedExtraExample[1]~console.log(~name~.length); // 2
console.log(~name~.BYTES_PER_ELEMENT); // ~BYTES_PER_ELEMENT~

// From an array
const x = new ~cls~([~literal(21)~, ~literal(31)~]);
console.log(x[1]); // ~literal(31)~

// From another TypedArray
const y = new ~cls~(x);
console.log(y[0]); // ~literal(21)~

// From an ArrayBuffer
const buffer = new ArrayBuffer(~BYTES_PER_ELEMENT * 8~);
const z = new ~cls~(buffer, ~BYTES_PER_ELEMENT~, 4);
console.log(z.byteOffset); // ~BYTES_PER_ELEMENT~

// From an iterable
const iterable = (function* () {
  yield* [~literal(1)~, ~literal(2)~, ~literal(3)~];
})();
const ~name~FromIterable = new ~cls~(iterable);
console.log(~name~FromIterable);
// ~cls~ [~literal(1)~, ~literal(2)~, ~literal(3)~]
```

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

~polyfillLink~
- [JavaScript typed arrays](/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
- {{jsxref("TypedArray")}}
- {{jsxref("ArrayBuffer")}}
- {{jsxref("DataView")}}
