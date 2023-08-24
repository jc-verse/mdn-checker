import FS from "node:fs/promises";
import Path from "node:path";
import * as Cheerio from "cheerio";
import { contentPath, type FileContext } from "../context.js";

async function* getFiles(dir: string): AsyncGenerator<[string, string]> {
  const dirents = await FS.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = Path.join(dir, dirent.name);
    if (dirent.isDirectory()) yield* getFiles(res);
    else if (res.endsWith(".html"))
      yield Promise.all([res, FS.readFile(res, "utf8")]);
  }
}

const buildDir = Path.join(contentPath, "build");
const files = getFiles(Path.join(buildDir, "/en-us/docs/web/javascript"));
const pathToIds = new Map<string, string[]>();
const pathToLinks = new Map<string, URL[]>();

for await (const [filename, content] of files) {
  const $ = Cheerio.load(content);
  pathToLinks.set(
    filename,
    $("a")
      .map((i, el) => $(el).attr("href"))
      .get()
      .map(
        (url) =>
          new URL(
            url.startsWith("#")
              ? `${filename
                  .replace(/\/index.html/g, "")
                  .replace(buildDir, "")}${url}`
              : url,
            "https://developer.mozilla.org",
          ),
      )
      .filter(
        (url) =>
          url.hostname === "developer.mozilla.org" &&
          url.hash &&
          url.hash !== "#languages-switcher-button",
      ),
  );
  pathToIds.set(
    filename,
    $("[id]")
      .map((i, el) => $(el).attr("id"))
      .get(),
  );
}

export default function rule(context: FileContext): void {
  const failures = [];
  const urls = pathToLinks.get(
    context.path
      .replace("files/en-us", "build/en-us/docs")
      .replace(".md", ".html"),
  );
  if (!urls) throw new Error(`Invalid path received: ${context.path}`);
  for (const url of urls) {
    const referencedPath = Path.join(
      buildDir,
      url.pathname
        .replaceAll("*", "_star_")
        // cSpell:ignore doublecolon
        .replaceAll("::", "_doublecolon_")
        .replaceAll(":", "_colon_")
        .replaceAll("?", "_question_")
        .toLowerCase(),
      "index.html",
    );
    const ids = pathToIds.get(referencedPath);
    if (ids) {
      const target = ids.find((id) => id === decodeURI(url.hash.slice(1)));
      if (!target) {
        failures.push(
          `Anchor not found: ${url
            .toString()
            .replace("https://developer.mozilla.org", "")}`,
        );
      }
    } else if (url.pathname.includes("Web/JavaScript")) {
      // We don't check non-JS pages because we don't always build them
      failures.push(`Page not found: ${url}`);
    }
  }
  failures.forEach((f) => {
    context.report(f);
  });
}

Object.defineProperty(rule, "name", { value: "anchor-links" });

rule.appliesTo = () => "all";
