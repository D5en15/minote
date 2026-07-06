import ReactMarkdown from "react-markdown";
import type { PluggableList } from "unified";

import { markdownRehypePlugins } from "@/server/sanitize";
import type { Tag } from "@/types/database";

import { ShareThemeToggle } from "./share-theme-toggle";

const rehypePlugins = markdownRehypePlugins as PluggableList;

type SharedNoteViewProps = {
  contentMarkdown: string;
  tags: Tag[];
  title: string;
};

export function SharedNoteView({
  contentMarkdown,
  tags,
  title,
}: SharedNoteViewProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm text-muted-foreground">Shared note</p>
            <h1 className="mt-1 text-3xl font-semibold">{title || "Untitled"}</h1>
          </div>
          <ShareThemeToggle />
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
      </section>
    </main>
  );
}
