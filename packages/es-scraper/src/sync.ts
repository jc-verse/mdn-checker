import FS from "node:fs/promises";
import { generatedPath } from "./utils.js";

const revision = await FS.readFile(generatedPath("spec.html"), "utf-8");
const oldSHA = revision.match(/<!-- REVISION: (?<sha>.*) -->/)!.groups!.sha!;
const { sha: newSHA } = await fetch(
  "https://api.github.com/repos/tc39/ecma262/commits/main",
).then((res) => res.json());
if (oldSHA === newSHA) {
  console.log("No new changes");
  process.exit(0);
}

// Cannot use the API endpoint because the file is too big
const data = await fetch(
  "https://raw.githubusercontent.com/tc39/ecma262/main/spec.html",
).then((res) => res.text());

await FS.writeFile(
  generatedPath("spec.html"),
  `<!-- REVISION: ${newSHA} -->\n${data}`,
);
