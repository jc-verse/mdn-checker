import { escapeRegExp, interpolate, printRegExp } from "../utils.js";
import inheritance from "../data/inheritance.js";
import intrinsics from "../data/real-parameters.js";
import type {
  JSClass,
  JSNamespace,
  JSConstructor,
  Parameters,
} from "es-scraper";
import type { FileContext } from "../context.js";

function isKeyword(s: string) {
  // List copied verbatim from spec
  // prettier-ignore
  const keywords = [
    `await`,
    `break`,
    `case`, `catch`, `class`, `const`, `continue`,
    `debugger`, `default`, `delete`, `do`,
    `else`, `enum`, `export`, `extends`,
    `false`, `finally`, `for`, `function`,
    `if`, `import`, `in`, `instanceof`,
    `new`, `null`,
    `return`,
    `super`, `switch`,
    `this`, `throw`, `true`, `try`, `typeof`,
    `var`, `void`,
    `while`, `with`,
    `yield`,
  ];
  return keywords.includes(s);
}

const notePatterns: Record<JSConstructor["usage"], string> = {
  equivalent: escapeRegExp(
    "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance.",
  ),
  construct: escapeRegExp(
    '`~ctor~()` can only be constructed with [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to call it without `new` throws a {{jsxref("TypeError")}}.',
  ),
  call: escapeRegExp(
    '`~ctor~()` can only be called without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Attempting to construct it with `new` throws a {{jsxref("TypeError")}}.',
  ),
  get none(): never {
    throw new Error("Abstract classes should not have constructor page");
  },
  different: escapeRegExp`\`~ctor~()\` can be called with or without [\`new\`](/en-US/docs/Web/JavaScript/Reference/Operators/new), but ${"(?:sometimes )?"}with different effects. See [Return value](#return_value).`,
};

function selectNotePattern(ctor: string): string {
  if (["Intl.DateTimeFormat", "Intl.NumberFormat"].includes(ctor)) {
    return escapeRegExp(
      "`~ctor~()` can be called with or without [`new`](/en-US/docs/Web/JavaScript/Reference/Operators/new). Both create a new `~ctor~` instance. However, there's a special behavior when it's called without `new` and the `this` value is another `~ctor~` instance; see [Return value](#return_value).",
    );
  }
  if (ctor === "Intl.Collator") return notePatterns.equivalent;
  if (ctor.startsWith("Intl")) return notePatterns.construct;
  if (ctor === "InternalError") return notePatterns.equivalent;
  // TODO reinvestigate how to make this better when Iterator is in the spec
  if (ctor === "Iterator") {
    return (
      notePatterns.construct +
      escapeRegExp(
        " In addition, `Iterator()` cannot actually be constructed itself — it's usually implicitly constructed through [`super()`](/en-US/docs/Web/JavaScript/Reference/Operators/super) calls inside the constructor of a subclass.",
      )
    );
  }
  const target = intrinsics.find((o) => o.name === ctor);
  if (!target || target.type !== "class")
    throw new Error(`${ctor} is not a known global class`);
  return notePatterns[target.ctor!.usage];
}

function expectedFunctionSyntax(
  name: string,
  params: Parameters,
  usage: JSConstructor["usage"] = "call",
): RegExp {
  name = name.startsWith("[")
    ? `\\w+\\${name.replace("@@", "Symbol\\.").replace("]", "\\]")}`
    : isKeyword(name)
    ? `\\w+(?:Instance|Value)\\.${name}`
    : escapeRegExp(name);
  const base = "\\w+, ".repeat(params.required);
  const withOptional = Array.from(
    { length: params.optional + 1 },
    (_, i) => base + "\\w+, ".repeat(i),
  );
  const rest = [
    `\\w+1, `,
    `\\w+1, \\w+2, `,
    `\\w+1, \\w+2, /\\* …, \\*/ \\w+N, `,
  ].map((p) =>
    name.includes("Function")
      ? `${p}${withOptional.at(-1)}`
      : `${withOptional.at(-1)}${p}`,
  );
  const withRest = (params.rest ? withOptional.concat(rest) : withOptional).map(
    (p) => p.replace(/, $/u, ""),
  );
  const withNew = (() => {
    switch (usage) {
      case "call":
        return withRest.map((p) => `${name}\\(${p}\\)`);
      case "construct":
        return withRest.map((p) => `new ${name}\\(${p}\\)`);
      case "equivalent":
      case "different": {
        const withoutNew = withRest.map((p) => `${name}\\(${p}\\)`);
        return [...withoutNew.map((p) => `new ${p}`), ...withoutNew];
      }
      default:
        return [];
    }
  })();
  return new RegExp(`^${withNew.join("\n+")}$`, "u");
}

const typedArrayCtors = Object.keys(inheritance).filter((k) =>
  inheritance[k]?.includes("TypedArray"),
);

function checkSyntax(syntaxCode: string, context: FileContext) {
  // No data for 402 atm
  if (context.frontMatter.title.startsWith("Intl")) return;
  let parameters: Parameters | undefined = undefined;
  let funcName: string | undefined = undefined;
  let usage: JSConstructor["usage"] | undefined = undefined;
  switch (context.frontMatter["page-type"]) {
    case "javascript-function": {
      const data = intrinsics.find((o) => o.name === context.frontMatter.title);
      if (data?.type !== "function") {
        context.report("Does not correlate to known intrinsic");
        break;
      }
      funcName = data.name.replace("()", "");
      parameters = data.parameters;
      break;
    }
    case "javascript-constructor": {
      const ctor = context.frontMatter.title.replace(" constructor", "");
      const data = intrinsics.find(
        (o): o is JSClass => o.type === "class" && o.ctor?.name === ctor,
      )?.ctor;
      if (data?.type !== "constructor") {
        context.report("Does not correlate to known intrinsic");
        break;
      }
      funcName = data.name.replace("()", "");
      parameters = data.parameters;
      usage = data.usage;
      break;
    }
    case "javascript-instance-method": {
      const className = context.frontMatter.title.match(
        /^(?<class>.+)\.prototype/u,
      )?.groups?.class;
      if (!className) {
        context.report("Could not find class name");
        break;
      }
      const data = intrinsics
        .find((o): o is JSClass => o.type === "class" && o.name === className)
        ?.instanceMethods.find((m) => m.name === context.frontMatter.title);
      if (data?.type !== "method") {
        context.report("Does not correlate to known intrinsic");
        break;
      }
      const res = data.name.match(
        /\.prototype(?:\.(?<name>\w+)|(?<symbolName>\[@@\w+\]))\(\)/,
      )!.groups!;
      funcName = res.name ?? res.symbolName;
      parameters = data.parameters;
      break;
    }
    case "javascript-static-method": {
      const className =
        context.frontMatter.title.match(/^(?<class>.+)\.\w+\(/u)?.groups?.class;
      if (!className) {
        context.report("Could not find class name");
        break;
      }
      const data = intrinsics
        .find(
          (o): o is JSClass | JSNamespace =>
            (o.type === "class" || o.type === "namespace") &&
            o.name === className,
        )
        ?.staticMethods.find((m) => m.name === context.frontMatter.title);
      if (data?.type !== "method") {
        context.report("Does not correlate to known intrinsic");
        break;
      }
      funcName = data.name.match(/(?<name>.+)\(\)/)!.groups!.name!;
      parameters = data.parameters;
      break;
    }
  }
  if (parameters && funcName) {
    const syntax = expectedFunctionSyntax(funcName, parameters, usage);
    if (!syntax.test(syntaxCode))
      context.report(`Expected syntax: ${printRegExp(syntax)}`);
  }
}

export default function rule(context: FileContext): void {
  const syntaxSection = context.tree
    .getSubsection("Syntax")
    ?.ast.filter((n) => n.type !== "html" || !n.value.startsWith("<!--"));
  if (!syntaxSection) return;
  if (syntaxSection[0]!.type !== "code") {
    context.report("Missing syntax");
    return;
  } else if (
    !(
      syntaxSection[0].lang === "js-nolint" ||
      (context.path.includes("reference/regular_expressions") &&
        syntaxSection[0].lang === "regex")
    )
  ) {
    context.report("Syntax uses wrong language");
  } else {
    // We cannot check syntax atm because there are too many discrepancies
    // between the spec and content about what's optional
    // This is a super-hack to (a) make checkSyntax() used (b) make the code
    // not unreachable as far as TS is concerned
    checkSyntax(syntaxSection[0].value, context);
  }
  if (context.frontMatter["page-type"] === "javascript-constructor") {
    const note = syntaxSection[1];
    if (!note || note.type !== "callout" || note.kind !== "Note") {
      context.report("Missing note about constructor");
    } else {
      const noteText = context.getSource(note.children[0]!);
      const ctor = context.frontMatter.title.replace("() constructor", "");
      const expectedNote = new RegExp(
        interpolate(selectNotePattern(ctor), { ctor }),
      );
      if (!expectedNote.test(noteText.trim())) {
        context.report(
          `Note about constructor is wrong. Should be: ${printRegExp(
            expectedNote,
          )}`,
        );
      }
    }
  }
  const exceptionsSection = context.tree
    .getSubsection("Syntax")!
    .getSubsection("Exceptions")?.ast;
  // eslint-disable-next-line no-restricted-syntax, no-labels
  checkExceptions: if (!exceptionsSection) {
    // eslint-disable-next-line no-labels
    break checkExceptions;
  } else if (
    typedArrayCtors.includes(
      context.frontMatter.title.replace("() constructor", ""),
    )
  ) {
    if (
      exceptionsSection.length !== 1 ||
      context.getSource(exceptionsSection[0]!).trim() !==
        "See [`TypedArray`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#exceptions)."
    )
      context.report("TypedArray Exceptions incorrect");
  } else if (
    exceptionsSection.length !== 1 ||
    exceptionsSection[0]!.type !== "dl"
  ) {
    if (
      !["eval()", "Generator.prototype.throw()", "await"].includes(
        context.frontMatter.title,
      )
    )
      context.report("Exceptions section must be a single dl");
  } else {
    for (let i = 0; i < exceptionsSection[0].children.length; i += 2) {
      const dt = exceptionsSection[0].children[i]!;
      const dd = exceptionsSection[0].children[i + 1]!;
      if (
        !/^\{\{jsxref\("(?:TypeError|RangeError|SyntaxError|ReferenceError|URIError)"\)\}\}$/u.test(
          context.getSource(dt).trim(),
        )
      )
        context.report("Exceptions section must contain known errors");
      if (dd.children.length === 1) {
        if (
          !/^- : Thrown (?:in \[strict mode\]\(\/en-US\/docs\/Web\/JavaScript\/Reference\/Strict_mode\) )?if/u.test(
            context.getSource(dd).trim(),
          )
        )
          context.report("Exception description must start with 'Thrown if'");
      } else if (dd.children.length === 2 && dd.children[1]!.type === "list") {
        if (
          !/^- : Thrown (?:in \[strict mode\]\(\/en-US\/docs\/Web\/JavaScript\/Reference\/Strict_mode\) )?in one of the following cases:/u.test(
            context.getSource(dd).trim(),
          )
        ) {
          context.report(
            "Exception description must start with 'Thrown in one of the following cases:'",
          );
        }
      } else {
        context.report("Unknown exception description structure");
      }
    }
  }
}

Object.defineProperty(rule, "name", { value: "syntax-section" });

rule.appliesTo = () => "all";
