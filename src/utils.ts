export function interpolate(
  text: string,
  params: Record<string, unknown>,
): string {
  return text.replace(
    // eslint-disable-next-line prefer-named-capture-group
    /~([^~]+)~/g,
    (match, p1) =>
      // eslint-disable-next-line no-new-func
      Function(...Object.keys(params), `return ${p1}`)(Object.values(params)),
  );
}
