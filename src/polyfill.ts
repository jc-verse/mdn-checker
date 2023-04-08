/* eslint-disable @typescript-eslint/method-signature-style */
import "core-js/actual/array/from-async.js";
import "core-js/actual/array/group.js";
import "core-js/actual/array/to-spliced.js";

declare global {
  interface ArrayConstructor {
    fromAsync<T>(iterable: AsyncIterable<T>): Promise<T[]>;
  }
  interface Array<T> {
    group<K extends PropertyKey>(
      this: T[],
      key: (item: T) => K,
    ): Partial<Record<K, T[]>>;
    toSpliced(
      this: T[],
      start: number,
      deleteCount: number,
      ...items: T[]
    ): T[];
  }
}
