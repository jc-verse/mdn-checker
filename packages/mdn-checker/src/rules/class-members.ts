import nativeStringTag from "../data/native-to-string-tag.js";
import inheritance from "../data/inheritance.js";
import abstractClasses from "../data/abstract-classes.js";
import stringHTMLMethods from "../data/string-html-methods.js";
import namespaces from "../data/namespaces.js";
import { editingSteps } from "../utils.js";
import { toJSxRef as baseToJSxRef } from "../serializer/toJSxRef.js";

import type { Heading, DescriptionList } from "mdast";
import type { Context } from "../context.js";
import type { File } from "../parser/index.js";

const toJSxRef = (t: File | string) =>
  typeof t === "string" ? t : baseToJSxRef(t.frontMatter);

function adjustMembers(
  type: string,
  members: (File | string)[],
  context: Context,
) {
  const objName = context.frontMatter.title;
  switch (type) {
    case "Instance properties":
      if (["Proxy", ...namespaces].includes(objName)) break;
      if (
        !["Object", "Segments", "Iterator", "AsyncIterator"].includes(objName)
      ) {
        members.push(
          `{{jsxref("Object/constructor", "${objName}.prototype.constructor")}}`,
        );
      }
      if (
        !["Segments", ...nativeStringTag].includes(objName) &&
        !inheritance[objName]?.includes("TypedArray") &&
        !inheritance[objName]?.includes("Error")
      )
        members.push(`\`${objName}.prototype[@@toStringTag]\``);
      if (inheritance[objName]?.includes("Error"))
        members.push(`{{jsxref("Error/name", "${objName}.prototype.name")}}`);
      if (inheritance[objName]?.includes("TypedArray")) {
        members.push(
          `{{jsxref("TypedArray/BYTES_PER_ELEMENT", "${objName}.prototype.BYTES_PER_ELEMENT")}}`,
        );
      }
      if (objName === "TypedArray")
        members.push(`{{jsxref("TypedArray.prototype.BYTES_PER_ELEMENT")}}`);
      break;
    case "Static properties":
      if (namespaces.includes(objName))
        members.push(`\`${objName}[@@toStringTag]\``);
      if (inheritance[objName]?.includes("TypedArray")) {
        members.push(
          `{{jsxref("TypedArray/BYTES_PER_ELEMENT", "${objName}.BYTES_PER_ELEMENT")}}`,
        );
      }
  }
  members.sort((a, b) => {
    const aName =
      typeof a === "string"
        ? (a.match(/\{\{jsxref\((?:".*?", )?"(?<name>.*?)"/) ??
            a.match(/`(?<name>.*)`/))!.groups!.name!
        : a.frontMatter.title;
    const bName =
      typeof b === "string"
        ? (b.match(/\{\{jsxref\((?:".*?", )?"(?<name>.*?)"/) ??
            b.match(/`(?<name>.*)`/))!.groups!.name!
        : b.frontMatter.title;
    const sortToEnd = (predicate: (name: string) => boolean): number =>
      Number(predicate(aName)) - Number(predicate(bName));
    return (
      sortToEnd((name) =>
        (stringHTMLMethods as (string | undefined)[]).includes(
          name.match(/String.prototype.(?<name>.*)\(\)/)?.[1],
        ),
      ) ||
      sortToEnd((name) => !/[.[]/u.test(name)) ||
      sortToEnd(
        (name) =>
          // BYTES_PER_ELEMENT is present on TypedArray subtypes
          objName === "TypedArray" && name.endsWith("BYTES_PER_ELEMENT"),
      ) ||
      sortToEnd((name) => name.includes("@@")) ||
      aName.localeCompare(bName, "en-US")
    );
  });
}

export default function rule(context: Context): void {
  const subpages = context
    .getSubpages()
    .group((subpage) => subpage.frontMatter["page-type"]);
  const headings = context.ast.children
    .filter(
      (node): node is Heading => node.type === "heading" && node.depth === 2,
    )
    .map(
      (h) => [context.getSource(h), context.ast.children.indexOf(h)] as const,
    );
  const objName = context.frontMatter.title;
  if (!abstractClasses.includes(objName)) {
    if (
      context.frontMatter["page-type"] === "javascript-class" &&
      subpages["javascript-constructor"]?.length !== 1
    )
      context.report("A class should have one constructor");
    else if (
      context.frontMatter["page-type"] === "javascript-namespace" &&
      subpages["javascript-constructor"]?.length
    )
      context.report("A namespace should not have a constructor");
    checkMembers("Constructor", subpages["javascript-constructor"]);
  }
  checkMembers(
    "Static properties",
    Array<File>().concat(
      subpages["javascript-static-data-property"] ?? [],
      subpages["javascript-static-accessor-property"] ?? [],
      objName === "Intl" ? subpages["javascript-class"] ?? [] : [],
    ),
  );
  checkMembers("Static methods", subpages["javascript-static-method"]);
  checkMembers(
    "Instance properties",
    Array<File>().concat(
      subpages["javascript-instance-data-property"] ?? [],
      subpages["javascript-instance-accessor-property"] ?? [],
    ),
  );
  checkMembers("Instance methods", subpages["javascript-instance-method"]);

  function checkMembers(type: string, members: (File | string)[] = []) {
    adjustMembers(type, members, context);
    const thisHeading = headings.findIndex(([text]) => text === `## ${type}`);
    if (thisHeading === -1) {
      if (members.length) {
        context.report(
          `Missing ${type} section, needed for: ${members
            .map((m) => (typeof m === "string" ? m : m.frontMatter.title))
            .join(", ")}`,
        );
      }
      return;
    }
    const thisHeadingIndex = headings[thisHeading]![1];
    const nextHeadingIndex = headings[thisHeading + 1]?.[1];
    const section = context.ast.children.slice(
      thisHeadingIndex + 1,
      nextHeadingIndex,
    );
    if (!members.length) {
      if (
        !(
          section.length === 1 &&
          section[0]!.type === "paragraph" &&
          context
            .getSource(section[0]!)
            .startsWith(
              `_Inherits ${type.toLowerCase()} from its parent {{jsxref(`,
            )
        ) &&
        // There are all non-standard
        !(objName === "Error" && type === "Static methods")
      )
        context.report(`Unexpected ${type} section`);
      return;
    }
    const dls = section.filter(
      (node): node is DescriptionList => node.type === "dl",
    );
    // Merge the items for now; maybe we should check instance accessor and data
    // properties separately
    const items = dls.flatMap((dl) => dl.children);
    if (dls.length !== 1) {
      if (
        !(
          type === "Instance properties" ||
          (type === "Instance methods" && objName === "String") ||
          (type === "Static properties" && objName === "TypedArray")
        )
      )
        context.report(`${type} section should have one definition list`);
    }
    const actualTexts = items
      .filter((node) => node.type === "dt")
      .map((item) => context.getSource(item));
    const expectedTexts = members.map((m) => {
      let ref = toJSxRef(m);
      if (typeof m === "object" && m.frontMatter.status) {
        ref = `${ref} ${m.frontMatter.status
          .map(
            (s) =>
              ({
                experimental: "{{Experimental_Inline}}",
                deprecated: "{{Deprecated_Inline}}",
                "non-standard": "{{Non-standard_Inline}}",
              }[s]),
          )
          .join(" ")}`;
      }
      if (
        (typeof m === "object" &&
          ["Function: displayName"].includes(m.frontMatter.title)) ||
        (typeof m === "string" && m.includes("WeakRef.prototype.constructor"))
      )
        ref = `${ref} {{Optional_Inline}}`;
      return ref;
    });
    const edits = editingSteps(actualTexts, expectedTexts);
    if (edits.length) {
      context.report(
        `Section ${type} has unexpected items:
- ${edits
          .map(
            (e) =>
              ({
                d: `extra "${e[1]}"`,
                i: `missing "${e[1]}"`,
                s: `"${e[1]}" should be "${e[2]}"`,
              }[e[0]]),
          )
          .join("\n- ")}`,
      );
    }
  }
}

Object.defineProperty(rule, "name", { value: "class-members" });

rule.appliesTo = (context: Context) =>
  ["javascript-class", "javascript-namespace"].includes(
    context.frontMatter["page-type"],
  );
