import FS from "node:fs/promises";
import { generatedPath } from "../src/utils.js";

let oldSHA = null;

try {
  const revision = await FS.readFile(generatedPath("spec.html"), "utf-8");
  oldSHA = revision.match(/<!-- REVISION: (?<sha>.*) -->/)!.groups!.sha!;
} catch (e) {
  // If we couldn't read the old file, continue
  console.warn(
    "Could not read existing spec.html file; it may be missing. Downloading new version.",
  );
}
const { sha: newSHA } = await fetch(
  "https://api.github.com/repos/tc39/ecma262/commits/main",
).then((res) => res.json());
if (oldSHA === newSHA) {
  console.log("No new changes were found. Exiting.");
  process.exit(0);
}

// Cannot use the API endpoint because the file is too big
const data = await fetch(
  "https://raw.githubusercontent.com/tc39/ecma262/main/spec.html",
).then((res) => res.text());

try {
  await FS.access(generatedPath(""));
} catch (e) {
  // If the folder does not exist, create it
  await FS.mkdir(generatedPath(""));
}

await FS.writeFile(
  generatedPath("spec.html"),
  `<!-- REVISION: ${newSHA} -->\n${data}`,
);
