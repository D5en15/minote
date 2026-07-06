import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/server/supabase/server";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import type { Profile } from "@/types/database";

export class AuthenticationError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  return ensureProfileForUser(user);
}

export async function ensureProfileForUser(user: User): Promise<Profile> {
  const supabase = createServiceRoleClient();
  const metadata = user.user_metadata;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email?.toLowerCase() ?? "",
        display_name:
          typeof metadata.full_name === "string" && metadata.full_name.trim()
            ? metadata.full_name
            : null,
        avatar_url:
          typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()
            ? metadata.avatar_url
            : null,
      },
      {
        onConflict: "id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function requireAdminRole(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    throw new AuthorizationError("Admin role required");
  }

  return profile;
}
