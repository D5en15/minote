import { Lora, Poppins } from "next/font/google";
import ReactMarkdown from "react-markdown";
import type { PluggableList } from "unified";

import { cn } from "@/lib/utils";
import { markdownRehypePlugins } from "@/server/sanitize";
import type { ShareFontFamily, Tag } from "@/types/database";

import { ShareThemeToggle } from "./share-theme-toggle";

const rehypePlugins = markdownRehypePlugins as PluggableList;
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type SharedNoteViewProps = {
  contentMarkdown: string;
  createdAt: string;
  fontFamily: ShareFontFamily;
  ownerTier: "free" | "pro" | "studio";
  showBranding: boolean;
  showCreatedAt: boolean;
  showThemeToggle: boolean;
  tags: Tag[];
  title: string;
};

export function SharedNoteView({
  contentMarkdown,
  createdAt,
  fontFamily,
  ownerTier,
  showBranding,
  showCreatedAt,
  showThemeToggle,
  tags,
  title,
}: SharedNoteViewProps) {
  const contentFontClass =
    fontFamily === "lora" ? lora.className : poppins.className;

  return (
    <main
      className={cn(
        "min-h-screen bg-background text-foreground",
        contentFontClass
      )}
    >
      <section className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm text-muted-foreground">Shared note</p>
            <h1 className="mt-1 text-3xl font-semibold">{title || "Untitled"}</h1>
            {showCreatedAt ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Published {new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(createdAt))}
              </p>
            ) : null}
          </div>
          <ShareThemeToggle hidden={!showThemeToggle} />
        </div>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                key={tag.id}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}

        <article className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
          <ReactMarkdown rehypePlugins={rehypePlugins}>
            {contentMarkdown}
          </ReactMarkdown>
        </article>

        {showBranding ? (
          <footer className="mt-12 border-t border-border pt-4 text-sm text-muted-foreground">
            Powered by Minote
            {ownerTier !== "free" ? (
              <span className="ml-2 text-xs uppercase tracking-wide">
                {ownerTier}
              </span>
            ) : null}
          </footer>
        ) : null}
      </section>
    </main>
  );
}
