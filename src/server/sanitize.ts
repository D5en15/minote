import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";

export const markdownSanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["rel", "nofollow", "noopener", "noreferrer"],
      ["target", "_blank"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

export const markdownRehypePlugins = [
  [rehypeSanitize, markdownSanitizeSchema],
] as const;

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function stripDangerousHtml(input: string): string {
  return escapeHtml(input);
}
