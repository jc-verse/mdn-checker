---
title: Intl.~cls~.supportedLocalesOf()
slug: Web/JavaScript/Reference/Global_Objects/Intl/~cls~/supportedLocalesOf
page-type: javascript-static-method~experimentalNote[0]~
browser-compat: javascript.builtins.Intl.~cls~.supportedLocalesOf
---

```js setup
export const cls = /Intl\.(\w+)/.exec(context.frontMatter.title)[1];
export const job = {
  Collator: "collation",
  DateTimeFormat: "date and time formatting",
  DisplayNames: "display names",
  DurationFormat: "duration formatting",
  ListFormat: "list formatting",
  NumberFormat: "number formatting",
  PluralRules: "plural rules",
  RelativeTimeFormat: "relative time formatting",
  Segmenter: "segmentation",
}[cls];
export const experimentalNote =
  cls === "DurationFormat"
    ? ["\nstatus:\n  - experimental", "{{SeeCompatTable}}"]
    : ["", ""];
export const hasInteractiveExample = ["Collator", "DateTimeFormat", "NumberFormat", "PluralRules", "RelativeTimeFormat", "Segmenter"].includes(cls);
```

{{JSRef}}~experimentalNote[1]~

The **`Intl.~cls~.supportedLocalesOf()`** static method returns an array containing those of the provided locales that are supported in ~job~ without having to fall back to the runtime's default locale.

~hasInteractiveExample ? `
{{EmbedInteractiveExample("pages/js/intl-${cls.toLowerCase()}-supportedlocalesof.html","shorter")}}
` : ""~

## Syntax

```js-nolint
Intl.~cls~.supportedLocalesOf(locales)
Intl.~cls~.supportedLocalesOf(locales, options)
```

### Parameters

- `locales`
  - : A string with a BCP 47 language tag, or an array of such strings. For the general form and interpretation of the `locales` argument, see [the parameter description on the `Intl` main page](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument).
- `options` {{optional_inline}}
  - : An object that may have the following property:
    - `localeMatcher`
      - : The locale matching algorithm to use. Possible values are `"lookup"` and `"best fit"`; the default is `"best fit"`. For information about this option, see the {{jsxref("Intl", "Intl", "#locale_identification_and_negotiation", 1)}} page.

### Return value

An array of strings representing a subset of the given locale tags that are supported in ~job~ without having to fall back to the runtime's default locale.

## Examples

### Using supportedLocalesOf()

Assuming a runtime that supports Indonesian and German but not Balinese in ~job~, `supportedLocalesOf` returns the Indonesian and German language tags unchanged, even though `pinyin` collation is ~job === "collation" ? "not" : `neither relevant to ${job} nor`~ used with Indonesian, and a specialized German for Indonesia is unlikely to be supported. Note the specification of the `"lookup"` algorithm here — a `"best fit"` matcher might decide that Indonesian is an adequate match for Balinese since most Balinese speakers also understand Indonesian, and therefore return the Balinese language tag as well.

```js
const locales = ["ban", "id-u-co-pinyin", "de-ID"];
const options = { localeMatcher: "lookup" };
console.log(Intl.~cls~.supportedLocalesOf(locales, options));
// ["id-u-co-pinyin", "de-ID"]
```

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

## See also

- {{jsxref("Intl.~cls~")}}
