import "server-only";

import { createServerSupabaseClient } from "@/server/supabase/server";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import type { NoteWithTags, ShareLink } from "@/types/database";
import { hydrateNotesWithTags } from "@/server/repositories/tags";

export type ActiveShareLinkSummary = {
  id: string;
  accessMode: ShareLink["access_mode"];
  createdAt: string;
  expiresAt: string | null;
  status: ShareLink["status"];
};

function toActiveShareLinkSummary(link: ShareLink): ActiveShareLinkSummary {
  return {
    id: link.id,
    accessMode: link.access_mode,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    status: link.status,
  };
}

export async function createShareLink(input: {
  noteId: string;
  userId: string;
  tokenHash: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("share_links")
    .insert({
      note_id: input.noteId,
      user_id: input.userId,
      token_hash: input.tokenHash,
      status: "active",
      access_mode: "public",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getActiveShareLinkByNoteId(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("note_id", noteId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function revokeShareLink(noteId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("share_links")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("note_id", noteId)
    .eq("status", "active")
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function lookupActiveShareByTokenHash(tokenHash: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function touchShareLinkAccessed(linkId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("share_links")
    .update({
      last_accessed_at: new Date().toISOString(),
    })
    .eq("id", linkId);

  if (error) {
    throw error;
  }
}

export async function attachActiveShareLinksToNotes<TNote extends NoteWithTags>(
  notes: TNote[]
) {
  if (notes.length === 0) {
    return notes.map((note) => ({
      ...note,
      activeShareLink: null,
    }));
  }

  const supabase = await createServerSupabaseClient();
  const noteIds = notes.map((note) => note.id);
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .in("note_id", noteIds)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const byNoteId = new Map<string, ActiveShareLinkSummary>();

  for (const link of data) {
    byNoteId.set(link.note_id, toActiveShareLinkSummary(link));
  }

  return notes.map((note) => ({
    ...note,
    activeShareLink: byNoteId.get(note.id) ?? null,
  }));
}

export async function getPublicSharedNoteByNoteId(noteId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .eq("status", "active")
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
