#!/usr/bin/env node

import "./polyfill.js";

import { pathToFile, rules, Context, exitContext } from "./context.js";

await Promise.all(
  pathToFile.entries().map(async ([path, file]) => {
    const context = new Context(path, file);
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
    context.outputReports();
  }),
);

rules.forEach(({ default: rule }) => {
  exitContext.setName(rule.name);
  if ("onExit" in rule) rule.onExit(exitContext);
});
