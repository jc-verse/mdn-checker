import nativeStringTag from "../data/native-to-string-tag.js";
import inheritance from "../data/inheritance.js";
import abstractClasses from "../data/abstract-classes.js";
import { toJSxRef as baseToJSxRef } from "../utils.js";

import type { Heading, DescriptionList } from "mdast";
import type { Context } from "../index.js";
import type { File } from "../parser/index.js";

const toJSxRef = (t: File | string) =>
  typeof t === "string" ? t : baseToJSxRef(t.frontMatter);

function adjustMembers(
  type: string,
  members: (File | string)[],
  context: Context,
) {
  const objName = context.frontMatter.title;
  if (
    type === "Instance properties" &&
    !["Iterator", "AsyncIterator", "Proxy", "Segments"].includes(objName)
  ) {
    if (!["Object"].includes(objName)) {
      members.push(
        `{{jsxref("Object/constructor", "${objName}.prototype.constructor")}}`,
      );
    }
    if (
      !nativeStringTag.includes(objName) &&
      !inheritance[objName]?.includes("TypedArray") &&
      !inheritance[objName]?.includes("Error")
    )
      members.push(`\`${objName}.prototype[@@toStringTag]\``);
    if (inheritance[objName]?.includes("Error"))
      members.push(`{{jsxref("Error/name", "${objName}.prototype.name")}}`);
  }
  if (
    inheritance[objName]?.includes("TypedArray") &&
    type === "Static properties"
  ) {
    members.push(
      `{{jsxref("TypedArray/BYTES_PER_ELEMENT", "${objName}.BYTES_PER_ELEMENT")}}`,
    );
  } else if (
    inheritance[objName]?.includes("TypedArray") &&
    type === "Instance properties"
  ) {
    members.push(
      `{{jsxref("TypedArray/BYTES_PER_ELEMENT", "${objName}.prototype.BYTES_PER_ELEMENT")}}`,
    );
  } else if (objName === "TypedArray" && type === "Instance properties") {
    members.push(`{{jsxref("TypedArray.prototype.BYTES_PER_ELEMENT")}}`);
  }
  members.sort((a, b) => {
    const aName =
      typeof a === "string"
        ? (a.match(/\{\{jsxref\((?:".*?", )?"(?<name>.*?)"/) ??
            a.match(/`(?<name>).*`/))!.groups!.name!
        : a.frontMatter.title.replace("get ", "");
    const bName =
      typeof b === "string"
        ? (b.match(/\{\{jsxref\((?:".*?", )?"(?<name>.*?)"/) ??
            b.match(/`(?<name>).*`/))!.groups!.name!
        : b.frontMatter.title.replace("get ", "");
    if (!aName.match(/[.[]/) && bName.match(/[.[]/)) return 1;
    if (aName.match(/[.[]/) && !bName.match(/[.[]/)) return -1;
    if (aName.includes("@@") && !bName.includes("@@")) return 1;
    if (!aName.includes("@@") && bName.includes("@@")) return -1;
    return aName.localeCompare(bName);
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
    if (dls.length !== 1) {
      if (
        type !== "Instance properties" &&
        !(type === "Instance methods" && objName === "String")
      )
        context.report(`${type} section should have one definition list`);
      // Merge them for now; maybe we should check instance accessor and data
      // properties separately
      dls[0]!.children.push(...dls[1]!.children);
    }
    const dl = dls[0]!;
    const items = dl.children.filter((node) => node.type === "dt");
    let actualInd = 0,
      expectedInd = 0;
    while (actualInd < items.length && expectedInd < members.length) {
      const actualText = context.getSource(items[actualInd]!);
      const expectedMember = members[expectedInd]!;
      const expectedText =
        toJSxRef(expectedMember) +
        (typeof expectedMember === "string"
          ? ""
          : (expectedMember.frontMatter.status?.includes("experimental")
              ? " {{Experimental_Inline}}"
              : "") +
            (expectedMember.frontMatter.status?.includes("deprecated")
              ? " {{Deprecated_Inline}}"
              : "") +
            (expectedMember.frontMatter.status?.includes("non-standard")
              ? " {{Non-standard_Inline}}"
              : ""));
      if (actualText === expectedText) {
        actualInd++;
        expectedInd++;
        continue;
      }
      const actualInExpectedInd = members.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        (t, ind) => ind > expectedInd && toJSxRef(t) === actualText,
      );
      const expectedInActualInd = items.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        (t, ind) =>
          ind > actualInd &&
          t.type === "dt" &&
          context.getSource(t) === expectedText,
      );
      // At most one should be positive;
      // both are negative means no need to match further
      if (actualInExpectedInd * expectedInActualInd > 0) break;
      if (expectedInActualInd >= 0) {
        context.report(
          `Unrecognized ${type.toLowerCase()}: ${items
            .slice(actualInd, expectedInActualInd)
            .map((t) => context.getSource(t))
            .join(", ")}`,
        );
        actualInd = expectedInActualInd;
      } else {
        const allExpected = members
          .slice(expectedInd, actualInExpectedInd)
          .map((t) => toJSxRef(t));
        if (allExpected.length > 0) {
          context.report(
            `Missing ${type.toLowerCase()}: ${allExpected.join(", ")}`,
          );
        }
        expectedInd = actualInExpectedInd;
      }
    }
    if (expectedInd < members.length) {
      context.report(
        `Missing ${type.toLowerCase()}: ${members
          .slice(expectedInd)
          .map((t) => toJSxRef(t))
          .join(", ")}`,
      );
    }
    if (actualInd < items.length) {
      context.report(
        `Unrecognized ${type.toLowerCase()}: ${items
          .slice(actualInd)
          .filter((t) => t.type === "dt")
          .map((t) => context.getSource(t))
          .join(", ")}`,
      );
    }
  }
  if (!abstractClasses.includes(objName)) {
    if (subpages["javascript-constructor"]?.length !== 1)
      context.report("A class should have one constructor");
    else checkMembers("Constructor", subpages["javascript-constructor"]);
  }
  checkMembers(
    "Static properties",
    Array<File>().concat(
      subpages["javascript-static-data-property"] ?? [],
      subpages["javascript-static-accessor-property"] ?? [],
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
}

rule.appliesTo = (context: Context) =>
  context.frontMatter["page-type"] === "javascript-class";
