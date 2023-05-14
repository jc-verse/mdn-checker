import FS from "node:fs/promises";
import { generatedPath } from "./utils.js";
import type { JSGlobal } from "./types.js";

export async function getData(): Promise<JSGlobal[]> {
  const data = await FS.readFile(generatedPath("data.json"), "utf8");
  return JSON.parse(data);
}

// Purely exporting types
// eslint-disable-next-line no-restricted-syntax
export type * from "./types.js";
