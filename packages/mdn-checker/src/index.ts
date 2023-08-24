#!/usr/bin/env node
import "./polyfill.js";

import {
  pathToFile,
  rules,
  FileContext,
  ExitContext,
  type BaseContext,
} from "./context.js";
import { by } from "./arguments.js";
import { printReports } from "./printer.js";

export const allReports: {
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
