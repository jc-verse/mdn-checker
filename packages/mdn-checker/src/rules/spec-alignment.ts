import { getIntrinsics } from "es-scraper";
import proposals from "../data/stage-3.js";
import type { FileContext, ExitContext } from "../context.js";

const specced = new Set<string>();
function addSpecced(type: string, obj: string | { name: string }) {
  const name = typeof obj === "string" ? obj : obj.name;
  // We don't document .prototype, @@toStringTag, or constructor
  if (
    /(?:(?<!prototype)\.prototype|\[@@toStringTag\]|(?<!Object\.prototype)\.constructor)$/.test(
      name,
    )
  )
    return;
  let documentedName = name.replace(
    name.endsWith("BYTES_PER_ELEMENT") ? /^[a-z0-9]+/iu : "%TypedArray%",
    "TypedArray",
  );
  if (documentedName.endsWith("Error.prototype.message")) {
    documentedName = documentedName
      .replace(/.*(?=Error)/, "")
      .replace(".prototype.", ": ");
  } else if (documentedName.endsWith("Error.prototype.name")) {
    documentedName = documentedName.replace(/.*(?=Error)/, "");
  }
  specced.add(
    JSON.stringify({
      name: documentedName,
      type: `javascript-${type}`,
    }),
  );
}

const intrinsics = await getIntrinsics();

intrinsics.forEach((o) => {
  switch (o.type) {
    case "namespace":
      if (o.name === "%IteratorPrototype%") {
        addSpecced("class", "Iterator");
        o.staticMethods.forEach((m) => {
          addSpecced(
            "instance-method",
            m.name.replace("%IteratorPrototype%", "Iterator.prototype"),
          );
        });
        break;
      } else if (o.name === "%AsyncIteratorPrototype%") {
        addSpecced("class", "AsyncIterator");
        o.staticMethods.forEach((m) => {
          addSpecced(
            "instance-method",
            m.name.replace(
              "%AsyncIteratorPrototype%",
              "AsyncIterator.prototype",
            ),
          );
        });
        break;
      }
      addSpecced("namespace", o);
      o.staticMethods.forEach(addSpecced.bind(null, "static-method"));
      o.staticProperties.forEach((p) => {
        if (p.type === "accessor-property")
          addSpecced("static-accessor-property", p);
        else addSpecced("static-data-property", p);
      });
      break;
    case "class":
      addSpecced("class", o);
      if (o.ctor) addSpecced("constructor", `${o.ctor.name} constructor`);
      o.instanceMethods.forEach(addSpecced.bind(null, "instance-method"));
      o.prototypeProperties.forEach((p) => {
        if (p.type === "accessor-property")
          addSpecced("instance-accessor-property", p);
        else addSpecced("instance-data-property", p);
      });
      o.staticMethods.forEach(addSpecced.bind(null, "static-method"));
      o.staticProperties.forEach((p) => {
        if (p.type === "accessor-property")
          addSpecced("static-accessor-property", p);
        else addSpecced("static-data-property", p);
      });
      o.instanceProperties.forEach((p) => {
        addSpecced("instance-data-property", `${o.name}: ${p.name}`);
      });
      break;
    case "function":
      addSpecced("function", o);
      break;
    case "global-property":
      addSpecced("global-property", o);
      break;
  }
});

Object.entries(proposals).forEach(([name, features]) => {
  let warned = false;
  features.forEach((feature) => {
    if (specced.has(feature) && !warned) {
      console.warn(
        `Looks like ${name} is already in the main spec. Remember to update stage-3.ts.`,
      );
      warned = true;
    }
    specced.add(feature);
  });
});

export default function rule(context: FileContext): void {
  const key = JSON.stringify({
    name: context.frontMatter.title,
    type: context.frontMatter["page-type"],
  });
  if (!specced.has(key)) context.report("API not described in spec");
  specced.delete(key);
}

Object.defineProperty(rule, "name", { value: "spec-alignment" });

rule.appliesTo = (context: FileContext) =>
  context.frontMatter["page-type"].startsWith("javascript") &&
  /global_objects\/(?!intl)/.test(context.path) &&
  !context.frontMatter.title.includes("handler.") &&
  // Non-standard APIs are never specced
  !context.frontMatter.status?.includes("non-standard");

const deliberateNoDocs = [
  "Date.prototype.toGMTString()",
  "String.prototype.trimLeft()",
  "String.prototype.trimRight()",
  "TypedArray() constructor",
  "TypedArray.prototype.BYTES_PER_ELEMENT",
  "GeneratorFunction: length",
  "GeneratorFunction: name",
  "GeneratorFunction: prototype",
  "AsyncGeneratorFunction: length",
  "AsyncGeneratorFunction: name",
  "AsyncGeneratorFunction: prototype",
  "AsyncFunction: length",
  "AsyncFunction: name",
];

rule.onExit = (context: ExitContext) => {
  const undocumented = specced
    .values()
    .filter((n) => !deliberateNoDocs.includes(JSON.parse(n).name))
    .toArray();
  if (undocumented.length) {
    context.report(`Undocumented specced APIs:
${undocumented.join("\n")}`);
  }
};
