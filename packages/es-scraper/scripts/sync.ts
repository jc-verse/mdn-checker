import FS from "node:fs/promises";
import { generatedPath } from "../src/utils.js";

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
} catch (e) {
  // If we couldn't read the old file, continue
  console.log("No existing spec.html detected. Downloading...");
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

await FS.writeFile(generatedPath("spec.html"), `<!-- REVISION: ${newSHA} -->\n${data}`);

console.log(`Download complete! Saved to ${specFilePath}.`);
