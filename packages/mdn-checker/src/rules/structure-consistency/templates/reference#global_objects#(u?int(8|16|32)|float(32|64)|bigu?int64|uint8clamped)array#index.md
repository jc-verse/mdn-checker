---
title: ~cls~
slug: Web/JavaScript/Reference/Global_Objects/~cls~
page-type: javascript-class
browser-compat: javascript.builtins.~cls~
---

```js setup
export const cls = context.frontMatter.title;
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
export const dataType =
  BYTES_PER_ELEMENT * 8 +
  "-bit " +
  (cls.includes("Uint")
    ? "unsigned integers"
    : cls.includes("Int")
    ? "signed integers"
    : "floating point numbers") +
  (cls.includes("Clamped") ? " clamped to 0–255" : "");
```

{{JSRef}}

The **`~cls~`** typed array represents an array of ~dataType~~BYTES_PER_ELEMENT === 1 ? "" : " in the platform byte order. If control over byte order is needed, use {{jsxref(\"DataView\")}} instead"~. The contents are initialized to `~literal(0)~`. Once established, you can reference elements in the array using the object's methods, or using standard array index syntax (that is, using bracket notation).

`~cls~` is a subclass of the hidden {{jsxref("TypedArray")}} class.

## Constructor

- {{jsxref("~cls~/~cls~", "~cls~()")}}
  - : Creates a new `~cls~` object.

## Static properties

_Also inherits static properties from its parent {{jsxref("TypedArray")}}_.

- {{jsxref("TypedArray/BYTES_PER_ELEMENT", "~cls~.BYTES_PER_ELEMENT")}}
  - : Returns a number value of the element size. `~BYTES_PER_ELEMENT~` in the case of `~cls~`.

## Static methods

_Inherits static methods from its parent {{jsxref("TypedArray")}}_.

## Instance properties

_Also inherits instance properties from its parent {{jsxref("TypedArray")}}_.

These properties are defined on `~cls~.prototype` and shared by all `~cls~` instances.

- {{jsxref("TypedArray/BYTES_PER_ELEMENT", "~cls~.prototype.BYTES_PER_ELEMENT")}}
  - : Returns a number value of the element size. `~BYTES_PER_ELEMENT~` in the case of a `~cls~`.
- {{jsxref("Object/constructor", "~cls~.prototype.constructor")}}
  - : The constructor function that created the instance object. For `~cls~` instances, the initial value is the {{jsxref("~cls~/~cls~", "~cls~")}} constructor.

## Instance methods

_Inherits instance methods from its parent {{jsxref("TypedArray")}}_.

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
- [JavaScript typed arrays](/en-US/docs/Web/JavaScript/Guide/Typed_arrays) guide
- {{jsxref("TypedArray")}}
- {{jsxref("ArrayBuffer")}}
- {{jsxref("DataView")}}
