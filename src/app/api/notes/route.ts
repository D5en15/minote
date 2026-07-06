import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteCreateSchema, noteListQuerySchema } from "@/server/schemas";
import {
  createUserNote,
  listUserNotes,
} from "@/server/services/notes";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const parsed = noteListQuerySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    tag: request.nextUrl.searchParams.get("tag") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid notes query", {
      details: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const notes = await listUserNotes({
      search: parsed.data.search,
      status: parsed.data.status,
      tagId: parsed.data.tag,
    });

    return successResponse({ notes });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to load notes");
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const parsed = noteCreateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid note payload", {
      details: z.flattenError(parsed.error).fieldErrors,
    });
  }

  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const note = await createUserNote(user.id, parsed.data, request);
    return successResponse({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOTE_LIMIT_REACHED") {
        return errorResponse("FORBIDDEN", "Note limit reached");
      }

      if (error.message === "DAILY_CREATE_LIMIT_REACHED") {
        return errorResponse("FORBIDDEN", "Daily note creation limit reached");
      }
    }

    return errorResponse("INTERNAL_ERROR", "Unable to create note");
  }
}
