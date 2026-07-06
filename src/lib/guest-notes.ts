"use client";

import type { GuestNote } from "@/types/guest-note";

export const GUEST_NOTES_STORAGE_KEY = "minote:guest-notes";

type GuestImportPreviewResult = {
  importCount: number;
  renamedNotes: Array<{
    localId: string;
    originalTitle: string;
    finalTitle: string;
  }>;
};

export function readGuestNotes(): GuestNote[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(GUEST_NOTES_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as GuestNote[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (note): note is GuestNote =>
        typeof note?.localId === "string" &&
        typeof note?.title === "string" &&
        typeof note?.contentMarkdown === "string" &&
        Array.isArray(note?.tags)
    );
  } catch {
    return [];
  }
}

export function writeGuestNotes(notes: GuestNote[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function clearGuestNotes() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_NOTES_STORAGE_KEY);
}

export function createGuestNote(): GuestNote {
  const now = new Date().toISOString();

  return {
    localId: crypto.randomUUID(),
    title: "Untitled",
    contentMarkdown: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function hasGuestNotes() {
  return readGuestNotes().length > 0;
}

export async function previewGuestImport(notes: GuestNote[]) {
  const response = await fetch("/api/import/guest/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });
  const payload = (await response.json()) as {
    ok: boolean;
    data?: GuestImportPreviewResult;
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Unable to preview guest import");
  }

  return payload.data;
}

export async function confirmGuestImport(notes: GuestNote[]) {
  const response = await fetch("/api/import/guest/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });
  const payload = (await response.json()) as {
    ok: boolean;
    data?: { importedCount: number };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Unable to import guest notes");
  }

  return payload.data;
}
