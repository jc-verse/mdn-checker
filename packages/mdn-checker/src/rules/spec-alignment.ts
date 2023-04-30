import { getData } from "es-scraper";
import type { Context, ExitContext } from "../context.js";

const specced = new Set<string>();
function addSpecced(type: string, obj: string | { name: string }) {
  const name = typeof obj === "string" ? obj : obj.name;
  // We don't document .prototype, @@toStringTag, or constructor
  if (
    /(?:\.prototype|\[@@toStringTag\]|(?<!Object\.prototype)\.constructor)$/.test(
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

const data = await getData();

data.forEach((o) => {
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
      if (o.constructor)
        addSpecced("constructor", `${o.constructor.name} constructor`);
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

const documented = new Set<string>();

export default function rule(context: Context): void {
  documented.add(
    JSON.stringify({
      name: context.frontMatter.title,
      type: context.frontMatter["page-type"],
    }),
  );
}

Object.defineProperty(rule, "name", { value: "spec-alignment" });

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"].startsWith("javascript") &&
  /global_objects\/(?!intl)/.test(context.path) &&
  !context.frontMatter.title.includes("handler.");

rule.onExit = (context: ExitContext) => {
  const unrecognized = documented.difference(specced);
  if (unrecognized.size) {
    context.report(`Unrecognized content pages:
${[...unrecognized].join("\n")}`);
  }
  const undocumented = specced.difference(documented);
  if (undocumented.size) {
    context.report(`Undocumented specced APIs:
${[...undocumented].join("\n")}}`);
  }
};
