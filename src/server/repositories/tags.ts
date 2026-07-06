import "server-only";

import { createServerSupabaseClient } from "@/server/supabase/server";
import { normalizeTagName } from "@/server/tags";
import type { Note, NoteWithTags, Tag } from "@/types/database";

function createEmptyTagMap(noteIds: string[]) {
  return new Map<string, Tag[]>(noteIds.map((noteId) => [noteId, []]));
}

export async function listTagsForUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("normalized_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listTagsForNotes(noteIds: string[]) {
  if (noteIds.length === 0) {
    return createEmptyTagMap(noteIds);
  }

  const supabase = await createServerSupabaseClient();
  const { data: noteTagRows, error: noteTagError } = await supabase
    .from("note_tags")
    .select("*")
    .in("note_id", noteIds);

  if (noteTagError) {
    throw noteTagError;
  }

  if (noteTagRows.length === 0) {
    return createEmptyTagMap(noteIds);
  }

  const uniqueTagIds = [...new Set(noteTagRows.map((row) => row.tag_id))];
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("*")
    .in("id", uniqueTagIds);

  if (tagsError) {
    throw tagsError;
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByNoteId = createEmptyTagMap(noteIds);

  for (const row of noteTagRows) {
    const tag = tagsById.get(row.tag_id);

    if (!tag) {
      continue;
    }

    tagsByNoteId.get(row.note_id)?.push(tag);
  }

  for (const tagsForNote of tagsByNoteId.values()) {
    tagsForNote.sort((left, right) =>
      left.normalized_name.localeCompare(right.normalized_name)
    );
  }

  return tagsByNoteId;
}

export async function hydrateNotesWithTags<TNote extends Note>(notes: TNote[]) {
  const tagsByNoteId = await listTagsForNotes(notes.map((note) => note.id));

  return notes.map(
    (note) =>
      ({
        ...note,
        tags: tagsByNoteId.get(note.id) ?? [],
      }) satisfies NoteWithTags
  );
}

export async function findOrCreateTag(userId: string, name: string) {
  const supabase = await createServerSupabaseClient();
  const normalizedName = normalizeTagName(name);
  const { data: existing, error: existingError } = await supabase
    .from("tags")
    .select("*")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({
      user_id: userId,
      name: name.trim().replace(/\s+/g, " "),
      normalized_name: normalizedName,
    })
    .select("*")
    .single();

  if (!error) {
    return data;
  }

  if (error.code === "23505") {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("tags")
      .select("*")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return duplicate;
    }
  }

  throw error;
}

export async function attachTagToNote(noteId: string, tagId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("note_tags").upsert(
    {
      note_id: noteId,
      tag_id: tagId,
    },
    {
      onConflict: "note_id,tag_id",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw error;
  }
}

export async function detachTagFromNote(noteId: string, tagId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) {
    throw error;
  }
}

export async function listTagIdsForNote(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select("tag_id")
    .eq("note_id", noteId);

  if (error) {
    throw error;
  }

  return data.map((row) => row.tag_id);
}

export async function getTagById(tagId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("id", tagId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function cleanupUnusedTag(tagId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: linkedRows, error: linkedRowsError } = await supabase
    .from("note_tags")
    .select("note_id")
    .eq("tag_id", tagId)
    .limit(1);

  if (linkedRowsError) {
    throw linkedRowsError;
  }

  if (linkedRows.length > 0) {
    return;
  }

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) {
    throw error;
  }
}
