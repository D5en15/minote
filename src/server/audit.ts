import "server-only";

import { createServiceRoleClient } from "@/server/supabase/service-role";
import type { AuditEntityType, AuditEventType } from "@/server/audit-events";
import type { Json } from "@/types/database";

type AuditMetadata = Record<string, Json | undefined>;

export type AuditLogInput = {
  actorUserId?: string | null;
  eventType: AuditEventType;
  entityType: AuditEntityType;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: AuditMetadata;
};

function cleanMetadata(metadata: AuditMetadata = {}): Record<string, Json> {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  ) as Record<string, Json>;
}

export async function writeAuditLog(input: AuditLogInput) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    metadata: cleanMetadata(input.metadata),
  });

  if (error) {
    throw error;
  }
}
