import FS from "node:fs/promises";
import YAML from "yaml";
import z from "zod";

const configSchema = z.object({
  rules: z.record(z.boolean()),
});

export async function loadConfig(): Promise<z.infer<typeof configSchema>> {
  const file = await FS.readFile("config.yml", "utf-8");
  return configSchema.parse(YAML.parse(file));
}
