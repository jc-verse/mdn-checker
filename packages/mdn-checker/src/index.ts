#!/usr/bin/env node
import "./polyfill.js";

import FS from "node:fs/promises";
import Path from "node:path";
import {
  javascriptPath,
  pathToFile,
  FileContext,
  ExitContext,
  type BaseContext,
} from "./context.js";
import { by } from "./arguments.js";
import { loadConfig } from "./config.js";
import { parse, type File } from "./parser/index.js";
import { printReports } from "./printer.js";

async function* getFiles(
  dir: string,
): AsyncGenerator<[string, File], void, never> {
  const dirents = await FS.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const subPath = Path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(subPath);
    } else if (dirent.name.endsWith(".md")) {
      const source = await FS.readFile(subPath, "utf-8");
      const file = parse(source, subPath);
      yield [subPath, file];
    }
  }
}

const [allRules, files, config] = await Promise.all([
  Promise.all([
    // Load rules; each import() must take a literal to allow static analysis
    import("./rules/anchor-links.js"),
    import("./rules/bad-dl.js"),
    import("./rules/class-members.js"),
    import("./rules/data-prop.js"),
    import("./rules/deprecation-note.js"),
    import("./rules/description.js"),
    import("./rules/heading.js"),
    import("./rules/lint.js"),
    import("./rules/see-also.js"),
    import("./rules/spec-alignment.js"),
    import("./rules/structure-consistency/index.js"),
    import("./rules/syntax-section.js"),
  ]),
  Array.fromAsync(getFiles(javascriptPath)),
  loadConfig(),
]);

for (const [path, file] of files) pathToFile.set(path, file);

const rules = allRules.filter((rule) => config.rules[rule.default.name]);

const allReports: {
  [pathOrRule: string]: { [theOther: string]: string[] };
} = {};

if (by === "rule") {
  for (const {
    default: { name },
  } of rules)
    allReports[name] = {};
}

function registerReports(path: string, reports: BaseContext["reports"]) {
  if (Object.keys(reports).length === 0) return;
  switch (by) {
    case "file":
      allReports[path] = reports;
      break;
    case "rule":
      for (const [ruleName, messages] of Object.entries(reports)) {
        allReports[ruleName]![path] ??= [];
        allReports[ruleName]![path]!.push(...messages);
      }
      break;
  }
}

await Promise.all(
  pathToFile.entries().map(async ([path, file]) => {
    const context = new FileContext(path, file);
    // TODO this cannot be parallel because we change the context
    // Maybe we need https://github.com/tc39/proposal-async-context
    for (const { default: rule } of rules) {
      context.setName(rule.name);
      if (rule.appliesTo(context)) {
        try {
          await rule(context);
        } catch (e) {
          throw new Error(
            `Error when running ${rule.name} on ${context.path}`,
            { cause: e },
          );
        }
      }
    }
    registerReports(path, context.reports);
  }),
);

const exitContext = new ExitContext();

rules.forEach(({ default: rule }) => {
  exitContext.setName(rule.name);
  if ("onExit" in rule) rule.onExit(exitContext);
});

registerReports("*", exitContext.reports);

await printReports(allReports);
