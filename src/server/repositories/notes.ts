import "server-only";

import { attachActiveShareLinksToNotes } from "@/server/repositories/shares";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { hydrateNotesWithTags } from "@/server/repositories/tags";
import type { Note, NoteStatus, NoteWithTags } from "@/types/database";

export type ListNotesFilters = {
  search?: string;
  status?: NoteStatus;
  tagId?: string;
};

export type CreateNoteInput = {
  userId: string;
  title: string;
  contentMarkdown: string;
  contentText: string;
};

export type UpdateNoteInput = {
  noteId: string;
  title?: string;
  contentMarkdown?: string;
  contentText?: string;
  baseRevision: number;
};

function normalizeSearch(search?: string): string | undefined {
  const value = search?.trim();
  return value ? value : undefined;
}

export async function listNotesForUser(filters: ListNotesFilters = {}) {
  const supabase = await createServerSupabaseClient();
  const status = filters.status ?? "active";
  const search = normalizeSearch(filters.search);
  let noteIdsForTag: string[] | null = null;

  if (filters.tagId) {
    const { data: noteTagRows, error: noteTagError } = await supabase
      .from("note_tags")
      .select("note_id")
      .eq("tag_id", filters.tagId);

    if (noteTagError) {
      throw noteTagError;
    }

    noteIdsForTag = noteTagRows.map((row) => row.note_id);

    if (noteIdsForTag.length === 0) {
      return [] satisfies NoteWithTags[];
    }
  }

  let query = supabase
    .from("notes")
    .select("*")
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,content_text.ilike.%${search}%`
    );
  }

  if (noteIdsForTag) {
    query = query.in("id", noteIdsForTag);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const notes = await hydrateNotesWithTags(data);
  return attachActiveShareLinksToNotes(notes);
}

export async function getNoteById(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function createNote(input: CreateNoteInput) {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: input.userId,
      title: input.title,
      content_markdown: input.contentMarkdown,
      content_text: input.contentText,
      status: "active",
      revision: 1,
      last_saved_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function updateNote(input: UpdateNoteInput) {
  const supabase = await createServerSupabaseClient();
  const updates: Partial<Note> = {
    revision: input.baseRevision + 1,
    last_saved_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }

  if (input.contentMarkdown !== undefined) {
    updates.content_markdown = input.contentMarkdown;
  }

  if (input.contentText !== undefined) {
    updates.content_text = input.contentText;
  }

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", input.noteId)
    .eq("revision", input.baseRevision)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function moveNoteToTrash(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const trashedAt = new Date();
  const deleteAfter = new Date(trashedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("notes")
    .update({
      status: "trashed",
      trashed_at: trashedAt.toISOString(),
      delete_after: deleteAfter.toISOString(),
    })
    .eq("id", noteId)
    .neq("status", "deleted")
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function restoreNote(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      status: "active",
      trashed_at: null,
      delete_after: null,
    })
    .eq("id", noteId)
    .eq("status", "trashed")
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function permanentlyDeleteNote(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await attachActiveShareLinksToNotes(
    await hydrateNotesWithTags([data])
  );
  return note;
}

export async function revokeShareLinksForNote(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("share_links")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("note_id", noteId)
    .eq("status", "active");

  if (error) {
    throw error;
  }
}

export async function listExpiredTrashedNoteIds() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id")
    .eq("status", "trashed")
    .lt("delete_after", new Date().toISOString());

  if (error) {
    throw error;
  }

  return data.map((row) => row.id);
}

export async function permanentlyDeleteNoteForSystem(noteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("status", "trashed")
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [note] = await hydrateNotesWithTags([data]);
  return note;
}
