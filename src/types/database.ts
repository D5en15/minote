export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired"
  | "payment_failed"
  | "refunded";
export type NoteStatus = "active" | "trashed" | "deleted";
export type ShareLinkStatus = "active" | "revoked";
export type ShareAccessMode = "public" | "password";
export type NoteVersionReason = "idle_snapshot" | "manual" | "before_conflict";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          note_limit: number;
          daily_create_limit: number;
          version_retention_days: number;
          can_password_share: boolean;
          can_customize_share: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          note_limit: number;
          daily_create_limit: number;
          version_retention_days?: number;
          can_password_share?: boolean;
          can_customize_share?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          provider: "stripe";
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          grace_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          provider?: "stripe";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          grace_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content_markdown: string;
          content_text: string;
          status: NoteStatus;
          revision: number;
          trashed_at: string | null;
          delete_after: string | null;
          last_saved_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content_markdown?: string;
          content_text?: string;
          status?: NoteStatus;
          revision?: number;
          trashed_at?: string | null;
          delete_after?: string | null;
          last_saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          normalized_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          normalized_name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: [];
      };
      note_tags: {
        Row: {
          note_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          note_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["note_tags"]["Insert"]>;
        Relationships: [];
      };
      share_links: {
        Row: {
          id: string;
          note_id: string;
          user_id: string;
          token_hash: string;
          status: ShareLinkStatus;
          access_mode: ShareAccessMode;
          password_hash: string | null;
          expires_at: string | null;
          last_accessed_at: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          token_hash: string;
          status?: ShareLinkStatus;
          access_mode?: ShareAccessMode;
          password_hash?: string | null;
          expires_at?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["share_links"]["Insert"]>;
        Relationships: [];
      };
      note_versions: {
        Row: {
          id: string;
          note_id: string;
          user_id: string;
          revision: number;
          title: string;
          content_markdown: string;
          created_reason: NoteVersionReason;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          revision: number;
          title: string;
          content_markdown: string;
          created_reason: NoteVersionReason;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["note_versions"]["Insert"]>;
        Relationships: [];
      };
      usage_counters: {
        Row: {
          id: string;
          user_id: string;
          date_key: string;
          notes_created_count: number;
          write_request_count: number;
          export_count: number;
          share_access_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date_key: string;
          notes_created_count?: number;
          write_request_count?: number;
          export_count?: number;
          share_access_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_counters"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          event_type: string;
          entity_type: string;
          entity_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          event_type: string;
          entity_type: string;
          entity_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          type: string;
          processed_at: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          type: string;
          processed_at?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stripe_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = TableRow<"profiles">;
export type Plan = TableRow<"plans">;
export type Subscription = TableRow<"subscriptions">;
export type Note = TableRow<"notes">;
export type Tag = TableRow<"tags">;
export type ShareLink = TableRow<"share_links">;
