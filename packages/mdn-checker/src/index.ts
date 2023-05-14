#!/usr/bin/env node

import "./polyfill.js";

import { pathToFile, rules, Context, exitContext } from "./context.js";

pathToFile.forEach((file, path) => {
  const context = new Context(path, file);
  rules.forEach(({ default: rule }) => {
    context.setName(rule.name);
    if (rule.appliesTo(context)) {
      try {
        rule(context);
      } catch (e) {
        throw new Error(`Error when running ${rule.name} on ${context.path}`, {
          cause: e,
        });
      }
    }
  });
});

rules.forEach(({ default: rule }) => {
  exitContext.setName(rule.name);
  if ("onExit" in rule) rule.onExit(exitContext);
});
