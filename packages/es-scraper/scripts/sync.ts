import FS from "node:fs/promises";
import Path from "node:path";
import { generatedPath } from "../src/utils.js";

const specFilePath = generatedPath("spec.html");

// Ensure the generated directory exists
try {
  await FS.access(Path.dirname(specFilePath));
} catch {
  await FS.mkdir(Path.dirname(specFilePath));
}

const { sha: newSHA } = await fetch(
  "https://api.github.com/repos/tc39/ecma262/commits/main",
).then((res) => res.json());

try {
  const revision = await FS.readFile(generatedPath("spec.html"), "utf-8");
  const oldSHA = revision.match(/<!-- REVISION: (?<sha>.*) -->/)!.groups!.sha!;
  if (oldSHA === newSHA) {
    console.log("No new changes found. Exiting.");
    process.exit(0);
  } else {
    console.log("New version detected. Downloading...");
  }
} catch {
  // If we couldn't read the old file, continue
  console.log("No existing spec.html detected. Downloading...");
}

// Cannot use the API endpoint because the file is too big
const data = await fetch(
  "https://raw.githubusercontent.com/tc39/ecma262/main/spec.html",
).then((res) => res.text());

await FS.writeFile(specFilePath, `<!-- REVISION: ${newSHA} -->\n${data}`);

console.log(`Download completed! Saved to ${specFilePath}.`);
