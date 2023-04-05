import "core-js/actual/array/from-async.js";

declare global {
  interface ArrayConstructor {
    fromAsync: <T>(iterable: AsyncIterable<T>) => Promise<T[]>;
  }
}
