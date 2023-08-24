/* eslint-disable @typescript-eslint/method-signature-style */
import "core-js/actual/array/from-async.js";
import "core-js/actual/array/to-spliced.js";
import "core-js/actual/object/group-by.js";
import "core-js/actual/set/difference.js";
import "core-js/actual/iterator/filter.js";
import "core-js/actual/iterator/map.js";
import "core-js/actual/iterator/to-array.js";

declare global {
  interface ArrayConstructor {
    fromAsync<T>(iterable: AsyncIterable<T>): Promise<T[]>;
  }
  interface Array<T> {
    toSpliced(
      this: T[],
      start: number,
      deleteCount: number,
      ...items: T[]
    ): T[];
  }
  interface Set<T> {
    difference(other: Set<T>): Set<T>;
  }
  interface IterableIterator<T> {
    map<U>(callback: (value: T, index: number) => U): IterableIterator<U>;
    filter<S extends T>(
      callback: (value: T, index: number) => value is S,
    ): IterableIterator<S>;
    filter(callback: (value: T, index: number) => boolean): IterableIterator<T>;
    toArray(): T[];
  }
  interface Object {
    groupBy<T, K extends string | symbol>(
      items: Iterable<T>,
      key: (item: T) => K,
    ): Record<K, T[]>;
  }
}
