import FS from "node:fs/promises";
import { fileURLToPath } from "node:url";
import VM from "node:vm";
import { diffWords } from "diff";
import { interpolate, toEnglish } from "../../utils.js";
import type { Context } from "../../context.js";

const templateDir = new URL(
  "../../../src/rules/structure-consistency/templates",
  import.meta.url,
);

const templates = await FS.readdir(templateDir).then((files) =>
  Promise.all(
    files.map((file) =>
      FS.readFile(
        fileURLToPath(`${templateDir}/${encodeURIComponent(file)}`),
        "utf-8",
      ).then(
        (content) =>
          [
            new RegExp(file.replaceAll("#", "/").replaceAll("$", "\\"), "u"),
            content,
          ] as const,
      ),
    ),
  ),
);

export default function rule(context: Context): void {
  const template = templates.find(([path]) => path.test(context.path))![1];
  const setup = template.match(/```js setup\n(?<content>.+?)\n```\n\n/su)!;
  const content = template.replace(setup[0], "");
  const variables = setup.groups!.content!;
  const exports = {};
  VM.runInContext(
    variables,
    // TODO allow setup to import modules; this requires using VM.Module
    VM.createContext({
      context,
      exports,
      toEnglish,
    }),
  );
  const compiledContent = interpolate(content, exports).replace(
    /\n{3,}/g,
    "\n\n",
  );
  const diff = diffWords(context.source, compiledContent);
  if (!diff.some((part) => part.added || part.removed)) return;
  let report = "";
  diff.forEach((part, i) => {
    if (!part.added && !part.removed) {
      const lines = part.value.split("\n");
      report += `\u001b[30m${
        lines.length > 3
          ? `${i === 0 ? "" : `${lines[0]}\n`}...\n${lines.at(-1)}`
          : part.value
      }`;
    } else {
      report += `\u001b[${part.added ? "32" : "31"}m${part.value}`;
    }
  });
  context.report(`${report}\u001b[0m`);
}

Object.defineProperty(rule, "name", { value: "structure-consistency" });

rule.appliesTo = (context: Context) =>
  templates.find(([path]) => path.test(context.path));
