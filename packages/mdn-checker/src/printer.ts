import FS from "node:fs/promises";
import Path from "node:path";
import { pathToFile, type Report } from "./context.js";
import { output, by } from "./arguments.js";

const escapeHTML = (str: string) =>
  str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    // There's never <span> in text
    .replaceAll(/&lt;(?=\/?span)/g, "<");

const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw({ raw: strings }, ...values);

function formatPath(path: string) {
  if (path === "*") return "";
  if (output === "html") {
    return `<a href="https://github.com/mdn/content/tree/main/files/en-us${path.replace(
      /.*en-us/,
      "",
    )}" target="_blank">${escapeHTML(
      pathToFile.get(path)!.frontMatter.title,
    )}</a>`;
  }
  // TODO VS Code does not support hyperlinks to files (and the macOS Terminal
  // does not support OSC 8 at all!)
  // https://github.com/microsoft/vscode/issues/176812
  return `\x1b]8;;${path}\x07${
    pathToFile.get(path)!.frontMatter.title
  }\x1b]8;;\x07: ${Path.relative(process.cwd(), path)}`;
}

export async function printReports(allReports: {
  [pathOrRule: string]: { [theOther: string]: Report[] };
}): Promise<void> {
  let print = console.log;
  switch (output) {
    case "stderr":
      print = console.error;
    // Fallthrough
    case "stdout":
      for (const [pathOrRuleName, reportsRec] of Object.entries(allReports)) {
        print(
          by === "file" ? formatPath(pathOrRuleName) : `[${pathOrRuleName}]`,
        );
        for (const [ruleNameOrPath, reports] of Object.entries(reportsRec)) {
          print(
            by === "file"
              ? `  [${ruleNameOrPath}]`
              : `  ${formatPath(ruleNameOrPath)}`,
          );
          for (const report of reports)
            print(`    ${report.message.split("\n").join("\n    ")}`);
        }
      }
      break;
    case "html": {
      let document = "<ul>";
      for (const [pathOrRuleName, reportsRec] of Object.entries(allReports)) {
        document += `<li><details><summary>${
          by === "file" ? formatPath(pathOrRuleName) : pathOrRuleName
        } (${Object.values(reportsRec).reduce(
          (acc, r) => acc + r.length,
          0,
        )})</summary><ul>`;
        for (const [ruleNameOrPath, reports] of Object.entries(reportsRec)) {
          document += `<li><details><summary>${
            by === "file" ? ruleNameOrPath : formatPath(ruleNameOrPath)
          } (${reports.length})</summary><ul>`;
          for (const report of reports) {
            document += `<li>${escapeHTML(report.message).replaceAll(
              "\n",
              "<br>",
            )}</li>`;
          }
          document += "</ul></details></li>";
        }
        document += "</ul></details></li>";
      }
      document += "</ul>";
      await FS.writeFile(
        new URL("../generated/index.html", import.meta.url),
        html`
          <!DOCTYPE html>
          <html>
            <head>
              <title>MDN-checker output list</title>
              <style>
                :root {
                  --highlight-color: chocolate;
                  --red: red;
                  --green: green;
                  --cyan: lightseagreen;
                }
                body {
                  font-family: Menlo, Monaco, "Courier New", monospace;
                }
                ul {
                  list-style-type: none;
                }
                details > summary {
                  list-style-type: "[+] ";
                  cursor: pointer;
                }
                details[open] > summary {
                  list-style-type: "[–] ";
                }
                details:hover:not(:has(details:hover)) {
                  color: var(--highlight-color);
                }
                a {
                  color: inherit;
                }
                a:hover {
                  color: var(--highlight-color);
                }
                @media (prefers-color-scheme: dark) {
                  :root {
                    --highlight-color: yellow;
                    --red: tomato;
                    --green: springgreen;
                  }
                  body {
                    background-color: #202020;
                    color: #d1d1d1;
                  }
                }
              </style>
            </head>
            <body>
              ${document}
            </body>
          </html>
        `,
        "utf-8",
      );
      console.log(
        `HTML viewable at ${new URL(
          "../generated/index.html",
          import.meta.url,
        )}`,
      );
      break;
    }
    case "json":
      await FS.writeFile(
        new URL("../generated/report.json", import.meta.url),
        JSON.stringify(allReports, null, 2),
        "utf-8",
      );
      break;
  }
}
