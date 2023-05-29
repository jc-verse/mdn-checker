import "./polyfill.js";

import FS from "node:fs/promises";
import * as Cheerio from "cheerio";
import { generatedPath } from "../src/utils.js";
import { collectIntrinsics } from "./intrinsics.js";
import { collectEarlyErrors } from "./early-errors.js";

export type Section = {
  title: string;
  id: string;
  children: Section[];
};

export const $ = await FS.readFile(generatedPath("spec.html")).then((content) =>
  Cheerio.load(content),
);

function buildTOC(root = $(":root > body")) {
  return root
    .children("emu-clause, emu-annex")
    .map((_, el): Section => {
      const subRoot = $(el);
      return {
        title: $(subRoot.children("h1").get()[0]!)
          .text()
          .replace(/[\s\n]+/gu, " ")
          .trim(),
        id: subRoot.attr("id")!,
        children: buildTOC(subRoot),
      };
    })
    .get();
}

const toc = buildTOC();
const intrinsics = collectIntrinsics(toc);
const earlyErrors = collectEarlyErrors(toc);

async function writeWithBackup(path: string, content: string) {
  const old = await FS.readFile(generatedPath(path), "utf8").catch(() => "");
  if (old === content) {
    console.log(`No change to ${path}`);
  } else if (old !== "") {
    await FS.rename(
      generatedPath(path),
      generatedPath(path.replace(/\.\w+$/, ".bak$&")),
    );
    await FS.writeFile(generatedPath(path), content);
    console.log(`Updated ${path}. Backup saved; remember to compare the diff.`);
  } else {
    await FS.writeFile(generatedPath(path), content);
    console.log(`Created ${path}`);
  }
}

Promise.all([
  writeWithBackup("toc.json", JSON.stringify(toc, null, 2)),
  writeWithBackup("intrinsics.json", JSON.stringify(intrinsics, null, 2)),
  writeWithBackup("early-errors.json", JSON.stringify(earlyErrors, null, 2)),
]);
