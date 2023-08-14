import FS from "node:fs/promises";
import { fileURLToPath } from "node:url";
import VM from "node:vm";
import { diffWords } from "diff";
import { interpolate } from "../../utils.js";
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

export default async function rule(context: Context): Promise<void> {
  const template = templates.find(([path]) => path.test(context.path))![1];
  const setupBlock = template.match(/```js setup\n(?<content>.+?)\n```\n\n/su)!;
  const content = template.replace(setupBlock[0], "");
  const setup = setupBlock.groups!.content!;
  const exports = {};
  const vmContext = VM.createContext({ context, exports });
  const entry = new VM.SourceTextModule(
    `
  import * as Setup from "setup";

  for (const [key, value] of Object.entries(Setup)) {
    exports[key] = value;
  }
  `,
    { context: vmContext },
  );
  await entry.link(async (specifier) => {
    if (specifier === "setup")
      return new VM.SourceTextModule(setup, { context: vmContext });
    return new VM.SourceTextModule(
      await FS.readFile(fileURLToPath(`${templateDir}/${specifier}`), "utf-8"),
      { context: vmContext },
    );
  });
  await entry.evaluate();
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
