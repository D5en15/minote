import { NoteWorkspace } from "@/components/notes/note-workspace";
import { getCurrentUser } from "@/server/auth";
import { getNoteById } from "@/server/repositories/notes";

type NoteEditorPageProps = {
  params: Promise<{
    noteId: string;
  }>;
};

export default async function NoteEditorPage({ params }: NoteEditorPageProps) {
  const { noteId } = await params;
  const user = await getCurrentUser();
  const note = user ? await getNoteById(noteId) : null;
  const initialSelectedNote = note && note.user_id === user?.id ? note : null;

  return (
    <NoteWorkspace
      initialNoteNotFound={Boolean(user && !initialSelectedNote)}
      initialSelectedNote={initialSelectedNote}
      selectedNoteId={noteId}
    />
  );
}
