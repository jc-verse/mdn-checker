import FS from "node:fs/promises";
import Path from "node:path";
import { pathToFile } from "./context.js";
import { output, by } from "./arguments.js";

const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw({ raw: strings }, ...values);

function formatPath(path: string) {
  if (path === "*") return "";
  // TODO VS Code does not support hyperlinks to files (and the macOS Terminal
  // does not support OSC 8 at all!)
  // https://github.com/microsoft/vscode/issues/176812
  return `\x1b]8;;${path}\x07${
    pathToFile.get(path)!.frontMatter.title
  }\x1b]8;;\x07: ${Path.relative(process.cwd(), path)}`;
}

export async function printReports(allReports: {
  [pathOrRule: string]: { [theOther: string]: string[] };
}): Promise<void> {
  let print = console.log;
  switch (output) {
    case "stderr":
      print = console.error;
    // Fallthrough
    case "stdout":
      for (const [pathOrRuleName, reports] of Object.entries(allReports)) {
        print(
          by === "file" ? formatPath(pathOrRuleName) : `[${pathOrRuleName}]`,
        );
        for (const [ruleNameOrPath, messages] of Object.entries(reports)) {
          print(
            by === "file"
              ? `  [${ruleNameOrPath}]`
              : `  ${formatPath(ruleNameOrPath)}`,
          );
          for (const message of messages)
            print(`    ${message.split("\n").join("\n    ")}`);
        }
      }
      break;
    case "html": {
      let document = "<ul>";
      for (const [pathOrRuleName, reports] of Object.entries(allReports)) {
        document += `<li><details><summary>${
          by === "file"
            ? Path.relative(process.cwd(), pathOrRuleName)
            : pathOrRuleName
        } (${Object.values(reports).reduce(
          (acc, m) => acc + m.length,
          0,
        )} reports)</summary><ul>`;
        for (const [ruleNameOrPath, messages] of Object.entries(reports)) {
          document += `<li><details><summary>${
            by === "file"
              ? ruleNameOrPath
              : Path.relative(process.cwd(), ruleNameOrPath)
          } (${messages.length} reports)</summary><ul>`;
          for (const message of messages)
            document += `<li>${message.replaceAll("\n", "<br>")}</li>`;
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
                  color: chocolate;
                }
                .red {
                  color: red;
                }
                .green {
                  color: green;
                }
                .cyan {
                  color: lightseagreen;
                }
                @media (prefers-color-scheme: dark) {
                  body {
                    background-color: #202020;
                    color: #d1d1d1;
                  }
                  details:hover:not(:has(details:hover)) {
                    color: yellow;
                  }
                  .red {
                    color: tomato;
                  }
                  .green {
                    color: springgreen;
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
