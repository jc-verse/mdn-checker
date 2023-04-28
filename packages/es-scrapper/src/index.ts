import "./polyfill.js";

import FS from "node:fs/promises";
import * as Cheerio from "cheerio";
import { generatedPath, assert } from "./utils.js";

type Section = {
  title: string;
  id: string;
  children: Section[];
};

type Property =
  | {
      type: "data-property";
      name: string;
      writable: boolean;
      enumerable: boolean;
      configurable: boolean;
    }
  | {
      type: "accessor-property";
      name: string;
      enumerable: boolean;
      configurable: boolean;
      get: boolean;
      set: boolean;
    };

type Global =
  | {
      type: "namespace";
      name: string;
      global: boolean;
      staticProperties: Property[];
      staticMethods: (string | Property)[];
    }
  | {
      type: "class";
      name: string;
      global: boolean;
      constructor: boolean;
      staticProperties: Property[];
      staticMethods: (string | Property)[];
      prototypeProperties: Property[];
      instanceMethods: (string | Property)[];
      instanceProperties: Property[];
    }
  | {
      type: "global-property";
      name: string;
      writable: boolean;
      enumerable: boolean;
      configurable: boolean;
    }
  | {
      type: "function";
      name: string;
      global: boolean;
    };

const $ = await FS.readFile(generatedPath("spec.html")).then((content) =>
  Cheerio.load(content),
);

const typedArrayTypes = $("#table-the-typedarray-constructors dfn")
  .map((_, el) => $(el).text().replaceAll("%", ""))
  .get();

const errorTypes = $("#sec-native-error-types-used-in-this-standard dfn")
  .map((_, el) => $(el).text().replaceAll("%", ""))
  .get();

function buildTOC(root = $(":root > body")) {
  return root
    .children("emu-clause")
    .map((_, el): Section => {
      const subRoot = $(el);
      return {
        title: $(subRoot.children("h1").get()[0]!)
          .text()
          .replace(/[\s\n]+/gu, " ")
          .trim(),
        id: subRoot.attr("id")!,
        children: buildTOC(subRoot),
      };
    })
    .get();
}

function getBareSection(section: Section): Section {
  assert(
    section.children.every(
      (s) =>
        /^[A-Z][A-Za-z]+\s*\(|^`|Record$/u.test(s.title) &&
        s.children.length === 0,
    ) ||
      section.children.filter((s) => /^get |^set /.test(s.title)).length === 2,
    `Not all children are AOs/type-defs for ${section.title}`,
  );
  return section;
}

function makeMethod(s: Section): string | Property {
  const attributes = getAttributes(s);
  if (attributes === null) return s.title;
  return {
    type: "data-property",
    name: s.title,
    ...attributes,
  };
}

function makeProperty(s: Section): Property {
  if (s.children.filter((t) => /^get |^set /.test(t.title)).length === 2) {
    return {
      type: "accessor-property",
      name: s.title,
      enumerable: false,
      configurable: true,
      get: true,
      set: true,
    };
  } else if (/^get |^set /.test(s.title)) {
    return {
      type: "accessor-property",
      name: s.title.slice(4),
      enumerable: false,
      configurable: true,
      get: /^get /.test(s.title),
      set: /^set /.test(s.title),
    };
  }
  const attributes = getAttributes(s);
  return {
    type: "data-property",
    name: s.title,
    ...(attributes ?? {
      writable: true,
      enumerable: false,
      configurable: true,
    }),
  };
}

function getAttributes(s: Section): {
  writable: boolean;
  enumerable: boolean;
  configurable: boolean;
} | null {
  const paras = $(`#${s.id.replaceAll(/[.@]/g, "\\$&")} > p`)
    .filter((_, el) => $(el).text().includes("has the attributes"))
    .get();
  if (paras.length === 0) return null;
  assert(
    paras.length === 1,
    `Expected ${s.title} to have 1 attributes paragraph`,
  );
  const attributes = $(paras[0])
    .text()
    .match(
      /has the attributes \{ \[\[Writable\]\]: \*(?<writable>true|false)\*, \[\[Enumerable\]\]: \*(?<enumerable>true|false)\*, \[\[Configurable\]\]: \*(?<configurable>true|false)\* \}\./u,
    )!.groups!;
  return {
    writable: attributes.writable === "true",
    enumerable: attributes.enumerable === "true",
    configurable: attributes.configurable === "true",
  };
}

const toc = buildTOC();
await FS.writeFile(generatedPath("toc.json"), JSON.stringify(toc, null, 2));
const objects = toc
  .slice(
    toc.findIndex((s) => s.title === "Fundamental Objects"),
    toc.findIndex((s) => s.title === "Reflection") + 1,
  )
  .flatMap((s) => s.children)
  .flatMap((s) => {
    if (s.title === "Error Objects") {
      const endOfError =
        s.children.findIndex(
          (t) => t.title === "Properties of Error Instances",
        ) + 1;
      const subItems = s.children.slice(endOfError, -1);
      const [nativeErrorTypes, nativeErrorStructure, ...otherErrors] = subItems;
      assert(
        nativeErrorTypes!.title === "Native Error Types Used in This Standard",
      );
      assert(nativeErrorStructure!.title === "_NativeError_ Object Structure");
      // The nativeErrorTypes are already extracted in errorTypes; they will be
      // backfilled later
      return [
        { title: s.title, id: s.id, children: s.children.slice(0, endOfError) },
        nativeErrorStructure!,
        ...otherErrors,
      ];
    } else if (s.title === "TypedArray Objects") {
      const endOfTA =
        s.children.findIndex(
          (t) => t.title === "Abstract Operations for TypedArray Objects",
        ) + 1;
      return [
        { title: s.title, id: s.id, children: s.children.slice(0, endOfTA) },
        {
          title: "_TypedArray_",
          id: s.id,
          children: s.children.slice(endOfTA),
        },
      ];
    } else if (s.title === "Object Objects") {
      const prototypeProps = s.children.findIndex(
        (t) => t.title === "Properties of the Object Prototype Object",
      );
      const prototypePropsSection = s.children[prototypeProps]!;
      return {
        title: s.title,
        children: s.children.toSpliced(prototypeProps, 1, {
          title: prototypePropsSection.title,
          id: prototypePropsSection.id,
          children: prototypePropsSection.children.flatMap((t) => {
            switch (t.title) {
              case "Legacy Object.prototype Accessor Methods":
                return t.children;
              default:
                return [t];
            }
          }),
        }),
      };
    } else if (s.title === "Iteration") {
      return [
        s.children.find((t) => t.title === "The %IteratorPrototype% Object")!,
        s.children.find(
          (t) => t.title === "The %AsyncIteratorPrototype% Object",
        )!,
      ];
    } else if (s.title === "Module Namespace Objects") {
      // No page for this
      return [];
    }
    return [s];
  })
  .map(({ title, children }): Global => {
    function getSubsections(pattern: RegExp) {
      return (
        children
          .find((c) => pattern.test(c.title))
          ?.children.map(getBareSection) ?? []
      );
    }

    if (title.endsWith("Object")) {
      let staticPropertySections = getSubsections(/Value Properties of/u);
      let staticMethodSections = getSubsections(/Function Properties of/u);
      assert(staticPropertySections.every((p) => !p.title.endsWith(")")));
      assert(staticMethodSections.every((p) => p.title.endsWith(")")));
      if (!staticPropertySections.length && !staticMethodSections.length) {
        const props = children.map(getBareSection);
        staticPropertySections = props.filter((p) => !p.title.endsWith(")"));
        staticMethodSections = props.filter((p) => p.title.endsWith(")"));
      }
      const staticProperties = staticPropertySections.map(makeProperty);
      const staticMethods = staticMethodSections.map(makeMethod);
      return {
        type: "namespace",
        name: title.replace(/^The | Object$/gu, ""),
        global: false,
        staticProperties,
        staticMethods,
      };
    }
    const staticPropertySections = getSubsections(
      /Properties of .* Constructor/u,
    );
    const instancePropertySections = getSubsections(
      /Properties of .* Instances/u,
    );
    const prototypePropertySections = getSubsections(
      /Properties of .* Prototype Object/u,
    );
    const constructor = children.some((c) =>
      /The .* Constructor/u.test(c.title),
    );
    assert(instancePropertySections.every((p) => !p.title.endsWith(")")));
    const staticProperties = staticPropertySections
      .filter((p) => !p.title.endsWith(")"))
      .map(makeProperty);
    const staticMethods = staticPropertySections
      .filter((p) => p.title.endsWith(")"))
      .map(makeMethod);
    const prototypeProperties = prototypePropertySections
      .filter((p) => !p.title.endsWith(")"))
      .map(makeProperty);
    const instanceMethods = prototypePropertySections
      .filter((p) => p.title.endsWith(")"))
      .map(makeMethod);
    const instanceProperties = instancePropertySections.map(makeProperty);
    return {
      type: "class",
      name: title.replace(/ Objects| \(.*\)/gu, ""),
      global: false,
      constructor,
      staticProperties,
      staticMethods,
      prototypeProperties,
      instanceMethods,
      instanceProperties,
    };
  })
  .flatMap((s) => {
    function expandAbstractClass(abstractName: string, name: string): Global {
      if (s.type !== "class") throw new Error("Not a class");
      const toExpand = [
        "staticProperties",
        "staticMethods",
        "prototypeProperties",
        "instanceMethods",
      ] as const;
      return {
        type: "class",
        name,
        global: s.global,
        constructor: s.constructor,
        ...(Object.fromEntries(
          toExpand.map((k) => [
            k,
            s[k].map((p) => {
              if (typeof p === "string") return p.replace(abstractName, name);
              p.name = p.name.replace(abstractName, name);
              return p;
            }),
          ]),
        ) as Pick<
          Extract<Global, { type: "class" }>,
          (typeof toExpand)[number]
        >),
        instanceProperties: s.instanceProperties,
      };
    }
    if (s.type !== "class") return [s];
    if (s.name === "_TypedArray_")
      return typedArrayTypes.map((t) => expandAbstractClass("_TypedArray_", t));
    else if (s.name === "_NativeError_ Object Structure")
      return errorTypes.map((t) => expandAbstractClass("_NativeError_", t));
    return [s];
  });

const globals = toc.find((s) => s.title === "The Global Object")!.children;
assert(
  globals.length === 4 &&
    globals[0]!.title === "Value Properties of the Global Object" &&
    globals[1]!.title === "Function Properties of the Global Object" &&
    globals[2]!.title === "Constructor Properties of the Global Object" &&
    globals[3]!.title === "Other Properties of the Global Object",
  "Unexpected global object structure",
);
objects.push(
  ...globals[0]!.children.map((s) => {
    const section = getBareSection(s);
    return {
      type: "global-property" as const,
      name: section.title,
      ...(getAttributes(section) ?? {
        writable: true,
        enumerable: false,
        configurable: true,
      }),
    };
  }),
  ...globals[1]!.children
    .map((s) =>
      (s.title === "URI Handling Functions"
        ? s.children.filter((t) => !/^[A-Z]/u.test(t.title))
        : [s]
      ).map((t) => ({
        type: "function" as const,
        name: getBareSection(t).title,
        global: true,
      })),
    )
    .flat(2),
);
globals[2]!.children.forEach((s) => {
  const title = getBareSection(s).title.replace(" ( . . . )", "");
  const obj = objects.find((o) => o.name === title);
  assert(obj?.type === "class", `${title} is not a class`);
  obj.global = true;
});
globals[3]!.children.forEach((s) => {
  const title = getBareSection(s).title;
  const obj = objects.find((o) => o.name === title);
  assert(obj?.type === "namespace", `${title} is not a namespace`);
  obj.global = true;
});

await FS.writeFile(
  generatedPath("data.json"),
  JSON.stringify(objects, null, 2),
);
