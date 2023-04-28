import { fileURLToPath } from "node:url";

export function generatedPath(name: string): string {
  return fileURLToPath(new URL(`../generated/${name}`, import.meta.url));
}

export function assert(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition)
    {throw new Error(
      message ? `Assertion failed: ${message}` : "Assertion failed",
    );}
}
