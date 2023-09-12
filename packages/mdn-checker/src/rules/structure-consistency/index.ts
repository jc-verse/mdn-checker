import FS from "node:fs/promises";
import { fileURLToPath } from "node:url";
import VM from "node:vm";
import { diffWords } from "diff";
import { interpolate, color } from "../../utils.js";
import type { FileContext } from "../../context.js";

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

export default async function rule(context: FileContext): Promise<void> {
  const template = templates.find(([path]) => path.test(context.path))![1];
  const setupBlock = template.match(/```js setup\n(?<content>.+?)\n```\n\n/su)!;
  const content = template.replace(setupBlock[0], "");
  const setup = setupBlock.groups!.content!;
  const exports = {};
  const skip = Symbol("skip");
  const vmContext = VM.createContext({ context, exports, skip, console });
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
  try {
    await entry.evaluate();
  } catch (e) {
    if (e === skip) return;
    throw e;
  }
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
      report += color(
        "default",
        lines.length > 3
          ? `${i === 0 ? "" : `${lines[0]}\n`}...\n${lines.at(-1)}`
          : part.value,
      );
    } else {
      report += color(part.added ? "green" : "red", part.value);
    }
  });
  context.report(report);
}

Object.defineProperty(rule, "name", { value: "structure-consistency" });

rule.appliesTo = (context: FileContext) =>
  templates.find(([path]) => path.test(context.path));
