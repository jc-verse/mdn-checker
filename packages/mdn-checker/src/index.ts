#!/usr/bin/env node

import "./polyfill.js";

import { pathToFile, rules, Context, exitContext } from "./context.js";

pathToFile.forEach((file, path) => {
  const context = new Context(path, file);
  rules.forEach(({ default: rule }) => {
    context.setName(rule.name);
    if (rule.appliesTo(context)) rule(context);
  });
});

rules.forEach(({ default: rule }) => {
  exitContext.setName(rule.name);
  if ("onExit" in rule) rule.onExit(exitContext);
});
