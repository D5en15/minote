create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index profiles_role_idx on public.profiles(role);

create table public.plans (
  id text primary key,
  name text not null,
  note_limit integer not null check (note_limit > 0),
  daily_create_limit integer not null check (daily_create_limit > 0),
  version_retention_days integer not null default 0 check (version_retention_days >= 0),
  can_password_share boolean not null default false,
  can_customize_share boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.plans (
  id,
  name,
  note_limit,
  daily_create_limit,
  version_retention_days,
  can_password_share,
  can_customize_share
)
values
  ('free', 'Free', 100, 20, 0, false, false),
  ('premium_monthly', 'Premium Monthly', 10000, 500, 365, true, true),
  ('premium_yearly', 'Premium Yearly', 10000, 500, 365, true, true)
on conflict (id) do update set
  name = excluded.name,
  note_limit = excluded.note_limit,
  daily_create_limit = excluded.daily_create_limit,
  version_retention_days = excluded.version_retention_days,
  can_password_share = excluded.can_password_share,
  can_customize_share = excluded.can_customize_share;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id),
  provider text not null default 'stripe' check (provider in ('stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null check (
    status in (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'expired',
      'payment_failed',
      'refunded'
    )
  ),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grace_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_provider_customer_id_idx on public.subscriptions(provider_customer_id);
create unique index subscriptions_provider_subscription_id_uidx
  on public.subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;
create index subscriptions_status_idx on public.subscriptions(status);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled',
  content_markdown text not null default '',
  content_text text not null default '',
  status text not null default 'active' check (status in ('active', 'trashed', 'deleted')),
  revision integer not null default 1 check (revision > 0),
  trashed_at timestamptz,
  delete_after timestamptz,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_id_idx on public.notes(user_id);
create index notes_title_idx on public.notes(title);
create index notes_content_text_idx on public.notes(content_text);
create index notes_status_idx on public.notes(status);
create index notes_updated_at_idx on public.notes(updated_at desc);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  constraint tags_user_normalized_name_unique unique (user_id, normalized_name)
);

create index tags_user_id_idx on public.tags(user_id);
create index tags_normalized_name_idx on public.tags(normalized_name);

create table public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, tag_id)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  access_mode text not null default 'public' check (access_mode in ('public', 'password')),
  password_hash text,
  expires_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index share_links_note_id_idx on public.share_links(note_id);
create index share_links_user_id_idx on public.share_links(user_id);
create index share_links_status_idx on public.share_links(status);

create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  revision integer not null check (revision > 0),
  title text not null,
  content_markdown text not null,
  created_reason text not null check (
    created_reason in ('idle_snapshot', 'manual', 'before_conflict')
  ),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index note_versions_note_id_idx on public.note_versions(note_id);
create index note_versions_user_id_idx on public.note_versions(user_id);
create index note_versions_revision_idx on public.note_versions(revision);
create index note_versions_expires_at_idx on public.note_versions(expires_at);

create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_key date not null,
  notes_created_count integer not null default 0 check (notes_created_count >= 0),
  write_request_count integer not null default 0 check (write_request_count >= 0),
  export_count integer not null default 0 check (export_count >= 0),
  share_access_count integer not null default 0 check (share_access_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_counters_user_date_key_unique unique (user_id, date_key)
);

create index usage_counters_user_id_idx on public.usage_counters(user_id);
create index usage_counters_date_key_idx on public.usage_counters(date_key);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_event_type_idx on public.audit_logs(event_type);
create index audit_logs_entity_type_idx on public.audit_logs(entity_type);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index stripe_events_type_idx on public.stripe_events(type);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger usage_counters_set_updated_at
before update on public.usage_counters
for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
    and coalesce(auth.role(), '') <> 'service_role'
    and not public.is_admin(auth.uid())
  then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url
  )
  values (
    new.id,
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.share_links enable row level security;
alter table public.note_versions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "notes_select_own"
on public.notes
for select
to authenticated
using (user_id = auth.uid());

create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "notes_update_own"
on public.notes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using (user_id = auth.uid());

create policy "tags_select_own"
on public.tags
for select
to authenticated
using (user_id = auth.uid());

create policy "tags_insert_own"
on public.tags
for insert
to authenticated
with check (user_id = auth.uid());

create policy "tags_update_own"
on public.tags
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "tags_delete_own"
on public.tags
for delete
to authenticated
using (user_id = auth.uid());

create policy "note_tags_select_owned"
on public.note_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
);

create policy "note_tags_insert_owned"
on public.note_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags
    where tags.id = note_tags.tag_id
      and tags.user_id = auth.uid()
  )
);

create policy "note_tags_delete_owned"
on public.note_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
);

create policy "share_links_select_own"
on public.share_links
for select
to authenticated
using (user_id = auth.uid());

create policy "share_links_insert_own_note"
on public.share_links
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.notes
    where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
  )
);

create policy "share_links_update_own"
on public.share_links
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "share_links_delete_own"
on public.share_links
for delete
to authenticated
using (user_id = auth.uid());

create policy "note_versions_select_own"
on public.note_versions
for select
to authenticated
using (user_id = auth.uid());

create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (public.is_admin(auth.uid()));
