import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedNoteView } from "@/components/share/shared-note-view";
import { getPublicSharedNote } from "@/server/services/shares";

type SharedNotePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  const { token } = await params;
  const shared = await getPublicSharedNote(token);

  if (!shared) {
    notFound();
  }

  return (
    <SharedNoteView
      contentMarkdown={shared.note.content_markdown}
      createdAt={shared.note.created_at}
      fontFamily={shared.shareLink.font_family}
      ownerTier={shared.ownerTier}
      showBranding={shared.shareLink.show_branding}
      showCreatedAt={shared.shareLink.show_created_at}
      showThemeToggle={shared.shareLink.show_theme_toggle}
      tags={shared.note.tags}
      title={shared.note.title}
    />
  );
}
