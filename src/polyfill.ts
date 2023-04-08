import "core-js/actual/array/from-async.js";
import "core-js/actual/array/group.js";

declare global {
  interface ArrayConstructor {
    fromAsync: <T>(iterable: AsyncIterable<T>) => Promise<T[]>;
  }
  interface Array<T> {
    group: <K extends PropertyKey>(
      this: T[],
      key: (item: T) => K,
    ) => Partial<Record<K, T[]>>;
  }
}
