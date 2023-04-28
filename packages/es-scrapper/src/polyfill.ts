/* eslint-disable @typescript-eslint/method-signature-style */
import "core-js/actual/array/to-sorted.js";
import "core-js/actual/array/to-spliced.js";

declare global {
  interface Array<T> {
    toSorted(this: T[], compareFn?: (a: T, b: T) => number): T[];
    toSpliced(
      this: T[],
      start: number,
      deleteCount: number,
      ...items: T[]
    ): T[];
  }
}
