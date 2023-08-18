// The spec's definition of optional parameters does not always align with
// intuition. This amends the intrinsics data to align them with MDN.
import {
  getIntrinsics,
  type JSNamespace,
  type JSClass,
  type JSFunction,
} from "es-scraper";

const intrinsics = await getIntrinsics();

function makeOptional(name: string, count = 1) {
  const { parameters } = (() => {
    if (/^[A-Z]\w+$/u.test(name))
      return intrinsics.find((i): i is JSClass => i.name === name)!.ctor!;
    name = `${name}()`;
    if (/^\w+\.prototype.+\(\)$/u.test(name)) {
      const cls = name.split(".")[0]!;
      return intrinsics
        .find((i): i is JSClass => i.name === cls)!
        .instanceMethods.find((m) => m.name === name)!;
    } else if (/^\w+\.\w+\(\)$/u.test(name)) {
      const cls = name.split(".")[0]!;
      return intrinsics
        .find((i): i is JSClass | JSNamespace => i.name === cls)!
        .staticMethods.find((m) => m.name === name)!;
    }
    return intrinsics.find((i): i is JSFunction => i.name === name)!;
  })();
  parameters.optional += count;
  parameters.required -= count;
}

/* eslint-disable capitalized-comments */
makeOptional("AggregateError"); // message
makeOptional("Array.prototype.join"); // separator
makeOptional("Array.prototype.slice", 2); // start, end
makeOptional("Array.prototype.sort"); // compareFn
makeOptional("Array.prototype.splice"); // deleteCount
makeOptional("Array.prototype.toSorted"); // compareFn
makeOptional("Array.prototype.toSpliced"); // deleteCount
makeOptional("ArrayBuffer.prototype.slice", 2); // start, end
makeOptional("AsyncGenerator.prototype.next"); // value
makeOptional("AsyncGenerator.prototype.return"); // value
makeOptional("Atomics.wait"); // timeout
makeOptional("Atomics.waitAsync"); // locales, options
makeOptional("Error"); // message
makeOptional("EvalError"); // message
makeOptional("Function.prototype.apply"); // argsArray
makeOptional("Generator.prototype.next"); // value
makeOptional("Generator.prototype.return"); // value
makeOptional("Number.parseInt"); // radix
makeOptional("Number.prototype.toExponential"); // fractionDigits
makeOptional("Number.prototype.toFixed"); // digits
makeOptional("Number.prototype.toPrecision"); // precision
makeOptional("Object.create"); // propertiesObject
makeOptional("parseInt"); // radix
makeOptional("Promise.prototype.then"); // onRejected
makeOptional("RangeError"); // message
makeOptional("ReferenceError"); // message
makeOptional("RegExp.prototype[@@split]"); // limit
makeOptional("RegExp"); // flags
makeOptional("SharedArrayBuffer.prototype.slice", 2); // start, end
makeOptional("String.prototype.slice"); // end
makeOptional("String.prototype.split"); // limit
makeOptional("String.prototype.substr"); // length
makeOptional("String.prototype.substring"); // indexEnd
makeOptional("SyntaxError"); // message
makeOptional("TypeError"); // message
makeOptional("URIError"); // message

export default intrinsics;
