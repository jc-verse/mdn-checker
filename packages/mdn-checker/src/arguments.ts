import z from "zod";

function findArgValue(arg: string) {
  const index = process.argv.findIndex((a) => a === arg);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

export const output = z
  .union([
    z.literal("html"),
    z.literal("stdout"),
    z.literal("stderr"),
    z.literal("json"),
    z.undefined(),
  ])
  .default("stdout")
  .parse(findArgValue("--output"));

export const by = z
  .union([z.literal("rule"), z.literal("file"), z.undefined()])
  .default("file")
  .parse(findArgValue("--by"));
