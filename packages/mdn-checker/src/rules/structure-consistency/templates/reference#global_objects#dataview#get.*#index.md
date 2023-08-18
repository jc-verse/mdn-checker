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
export const valueRange = {
  "getInt8": 'An integer from -128 to 127, inclusive',
  "getUint8": 'An integer from 0 to 255, inclusive',
  "getInt16": 'An integer from -32768 to 32767, inclusive',
  "getUint16": 'An integer from 0 to 65535, inclusive',
  "getInt32": 'An integer from -2147483648 to 2147483647, inclusive',
  "getUint32": 'An integer from 0 to 4294967295, inclusive',
  "getBigInt64": 'A {{jsxref("BigInt")}} from -2<sup>63</sup> to 2<sup>63</sup>-1, inclusive',
  "getBigUint64": 'A {{jsxref("BigInt")}} from 0 to 2<sup>64</sup>-1, inclusive',
  "getFloat32": 'A floating point number from `-3.4e38` to `3.4e38`',
  "getFloat64": 'Any number value',
}[topic];
const { buffer } = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const dataview = new DataView(buffer);
export const result = dataview[topic](1);
```

{{JSRef}}

The **`~topic~()`** method of {{jsxref("DataView")}} instances reads ~BYTES_PER_ELEMENT~ byte~BYTES_PER_ELEMENT === 1 ? "" : "s starting"~ at the specified byte offset of this `DataView` and interprets ~BYTES_PER_ELEMENT === 1 ? "it" : "them"~ as ~dataType.startsWith("8") ? "an" : "a"~ ~dataType~.~BYTES_PER_ELEMENT === 1 ? "" : " There is no alignment constraint; multi-byte values may be fetched from any offset within bounds."~

{{EmbedInteractiveExample("pages/js/dataview-~topic.toLowerCase()~.html")}}

## Syntax

```js-nolint
~topic~(byteOffset)~BYTES_PER_ELEMENT === 1 ? "" : `
${topic}(byteOffset, littleEndian)`~
```

### Parameters

- `byteOffset`
  - : The offset, in bytes, from the start of the view to read the data from.~BYTES_PER_ELEMENT === 1 ? "" : `
- \`littleEndian\` {{optional_inline}}
  - : Indicates whether the data is stored in [little- or big-endian](/en-US/docs/Glossary/Endianness) format. If \`false\` or \`undefined\`, a big-endian value is read.
`~

### Return value

~valueRange~.

### Exceptions

- {{jsxref("RangeError")}}
  - : Thrown if the `byteOffset` is set such that it would read beyond the end of the view.

## Examples

### Using ~topic~()

```js
const { buffer } = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const dataview = new DataView(buffer);
console.log(dataview.~topic~(1)); // ~typeof result === "bigint" ? `${result}n` : result~
```

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- [JavaScript typed arrays](/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
- {{jsxref("DataView")}}
- {{jsxref("ArrayBuffer")}}
- {{jsxref("~topic.replace("get", "")~Array")}}
