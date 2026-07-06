export const AUDIT_EVENTS = {
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_MAGIC_LINK_REQUESTED: "auth.magic_link_requested",
  NOTE_CREATED: "note.created",
  NOTE_UPDATED: "note.updated",
  NOTE_DELETED: "note.deleted",
  NOTE_RESTORED: "note.restored",
  NOTE_EXPORTED: "note.exported",
  SHARE_CREATED: "share.created",
  SHARE_REVOKED: "share.revoked",
  SHARE_REGENERATED: "share.regenerated",
  BILLING_WEBHOOK_RECEIVED: "billing.webhook_received",
  BILLING_SUBSCRIPTION_UPDATED: "billing.subscription_updated",
} as const;

export type AuditEventType =
  (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

export const AUDIT_ENTITIES = {
  AUTH: "auth",
  NOTE: "note",
  SHARE_LINK: "share_link",
  SUBSCRIPTION: "subscription",
  USER: "user",
  SYSTEM: "system",
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];
