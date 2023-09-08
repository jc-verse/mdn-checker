---
title: DataView.prototype.~topic~()
slug: Web/JavaScript/Reference/Global_Objects/DataView/~topic~
page-type: javascript-instance-method
browser-compat: javascript.builtins.DataView.~topic~
---

```js setup
export const topic = context.frontMatter.title.replace("DataView.prototype.", "").replace("()", "");
export const BYTES_PER_ELEMENT = topic.match(/\d+/)[0] / 8;
export const dataType =
  BYTES_PER_ELEMENT * 8 +
  "-bit " +
  (topic.includes("Uint")
    ? "unsigned integer"
    : topic.includes("Int")
    ? "signed integer"
    : "floating point number");
const buffer = new ArrayBuffer(10);
const dataview = new DataView(buffer);
dataview[topic](0, topic.includes("Big") ? 3n : 3);
export const result = dataview[topic.replace("set", "get")](BYTES_PER_ELEMENT === 1 ? 0 : 1);
```

{{JSRef}}

The **`~topic~()`** method of {{jsxref("DataView")}} instances takes a ~topic.includes("Big") ? "BigInt" : "number"~ and stores it as ~dataType.startsWith("8") ? "an" : "a"~ ~dataType~ in the ~BYTES_PER_ELEMENT === 1 ? "" : `${BYTES_PER_ELEMENT} `~byte~BYTES_PER_ELEMENT === 1 ? "" : "s starting"~ at the specified byte offset of this `DataView`.~BYTES_PER_ELEMENT === 1 ? "" : " There is no alignment constraint; multi-byte values may be stored at any offset within bounds."~

{{EmbedInteractiveExample("pages/js/dataview-~topic.toLowerCase()~.html")}}

## Syntax

```js-nolint
~topic~(byteOffset, value)~BYTES_PER_ELEMENT === 1 ? "" : `
${topic}(byteOffset, value, littleEndian)`~
```

### Parameters

- `byteOffset`
  - : The offset, in bytes, from the start of the view to store the data in.
- `value`
  - : The value to set~topic.includes("Big") ? ' as a {{jsxref("BigInt")}}' : ""~. For how the value is encoded in bytes, see [Value encoding and normalization](/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#value_encoding_and_normalization).~BYTES_PER_ELEMENT === 1 ? "" : `
- \`littleEndian\` {{optional_inline}}
  - : Indicates whether the data is stored in [little- or big-endian](/en-US/docs/Glossary/Endianness) format. If \`false\` or \`undefined\`, a big-endian value is written.
`~

### Return value

{{jsxref("undefined")}}.

### Exceptions

- {{jsxref("RangeError")}}
  - : Thrown if the `byteOffset` is set such that it would store beyond the end of the view.

## Examples

### Using ~topic~()

```js
const buffer = new ArrayBuffer(10);
const dataview = new DataView(buffer);
dataview.~topic~(0, 3~topic.includes("Big") ? "n" : ""~);
dataview.~topic.replace("set", "get")~(~BYTES_PER_ELEMENT === 1 ? 0 : 1~); // ~typeof result === "bigint" ? `${result}n` : result~
```

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [JavaScript typed arrays](/en-US/docs/Web/JavaScript/Guide/Typed_arrays) guide
- {{jsxref("DataView")}}
- {{jsxref("ArrayBuffer")}}
- {{jsxref("~topic.replace("set", "")~Array")}}
