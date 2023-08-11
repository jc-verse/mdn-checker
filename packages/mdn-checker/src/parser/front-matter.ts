import z from "zod";
import fm from "front-matter";

const frontMatterSchema = z.union([
  // Known pages without browser-compat
  z.object({
    title: z.literal("Function: prototype"),
    slug: z.literal(
      "Web/JavaScript/Reference/Global_Objects/Function/prototype",
    ),
    "page-type": z.literal("javascript-instance-data-property"),
    "spec-urls": z.literal(
      "https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function-instances-prototype",
    ),
    status: z.never().optional(),
  }),
  z.object({
    title: z.literal("Expression statement"),
    slug: z.literal("Web/JavaScript/Reference/Statements/Expression_statement"),
    "page-type": z.literal("javascript-statement"),
    "spec-urls": z.literal(
      "https://tc39.es/ecma262/multipage/ecmascript-language-statements-and-declarations.html#sec-expression-statement",
    ),
    status: z.never().optional(),
  }),
  z
    .object({
      title: z.string(),
      slug: z.string().startsWith("Web/JavaScript"),
    })
    .and(
      z.discriminatedUnion("page-type", [
        z.object({
          "page-type": z.enum([
            "javascript-language-feature",
            "javascript-operator",
            "javascript-statement",
            "javascript-function",
            "javascript-global-property",
            "javascript-namespace",
            "javascript-class",
            "javascript-constructor",
            "javascript-instance-method",
            "javascript-instance-data-property",
            "javascript-instance-accessor-property",
            "javascript-static-method",
            "javascript-static-data-property",
            "javascript-static-accessor-property",
          ]),
          "browser-compat": z.string(),
          status: z
            .array(z.enum(["experimental", "non-standard", "deprecated"]))
            .optional(),
        }),
        z.object({
          "page-type": z.enum(["guide", "landing-page"]),
          "browser-compat": z.string().or(z.array(z.string())).optional(),
          status: z.never().optional(),
        }),
        z.object({
          "page-type": z.enum(["javascript-error"]),
          status: z.never().optional(),
        }),
      ]),
    ),
]);

export type FrontMatter = z.infer<typeof frontMatterSchema>;

export function parseFrontMatter(source: string, subPath: string): FrontMatter {
  const res = (fm as unknown as typeof fm.default)(source);
  const parseRes = frontMatterSchema.safeParse(res.attributes);
  if (!parseRes.success) {
    throw new Error(`Invalid front matter on ${subPath}`, {
      cause: parseRes.error,
    });
  }
  return parseRes.data;
}
