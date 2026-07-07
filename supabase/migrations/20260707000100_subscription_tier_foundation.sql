alter table public.profiles
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'pro', 'studio')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_status text
    check (
      stripe_subscription_status is null
      or stripe_subscription_status in (
        'active',
        'trialing',
        'past_due',
        'canceled',
        'expired',
        'unpaid',
        'payment_failed',
        'refunded'
      )
    ),
  add column if not exists current_period_end timestamptz;

create index if not exists profiles_tier_idx on public.profiles(tier);
create index if not exists profiles_stripe_customer_id_idx
  on public.profiles(stripe_customer_id);

alter table public.plans
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'pro', 'studio')),
  add column if not exists billing_interval text not null default 'forever'
    check (billing_interval in ('forever', 'monthly', 'yearly')),
  add column if not exists monthly_price_usd_cents integer
    check (monthly_price_usd_cents is null or monthly_price_usd_cents >= 0),
  add column if not exists yearly_price_usd_cents integer
    check (yearly_price_usd_cents is null or yearly_price_usd_cents >= 0),
  add column if not exists max_tags_per_note integer
    check (max_tags_per_note is null or max_tags_per_note > 0),
  add column if not exists can_use_lora_share_font boolean not null default false,
  add column if not exists can_hide_share_branding boolean not null default false,
  add column if not exists can_hide_share_metadata boolean not null default false,
  add column if not exists can_use_advanced_focus boolean not null default false,
  add column if not exists can_access_priority_support boolean not null default false,
  add column if not exists phase2_pdf_export_ready boolean not null default false,
  add column if not exists phase2_version_history_ready boolean not null default false,
  add column if not exists phase2_password_share_ready boolean not null default false,
  add column if not exists phase2_share_expiration_ready boolean not null default false;

update public.plans
set
  name = 'Zen Free',
  note_limit = 50,
  daily_create_limit = 3,
  tier = 'free',
  billing_interval = 'forever',
  monthly_price_usd_cents = 0,
  yearly_price_usd_cents = 0,
  max_tags_per_note = 3,
  can_password_share = false,
  can_customize_share = false,
  can_use_lora_share_font = false,
  can_hide_share_branding = false,
  can_hide_share_metadata = false,
  can_use_advanced_focus = false,
  can_access_priority_support = false,
  phase2_pdf_export_ready = false,
  phase2_version_history_ready = false,
  phase2_password_share_ready = false,
  phase2_share_expiration_ready = false
where id = 'free';

update public.plans
set
  name = 'Zen Pro Monthly',
  note_limit = 2147483647,
  daily_create_limit = 2147483647,
  tier = 'pro',
  billing_interval = 'monthly',
  monthly_price_usd_cents = 499,
  yearly_price_usd_cents = null,
  max_tags_per_note = null,
  can_password_share = false,
  can_customize_share = true,
  can_use_lora_share_font = true,
  can_hide_share_branding = false,
  can_hide_share_metadata = false,
  can_use_advanced_focus = true,
  can_access_priority_support = false,
  phase2_pdf_export_ready = true,
  phase2_version_history_ready = true,
  phase2_password_share_ready = false,
  phase2_share_expiration_ready = false
where id = 'premium_monthly';

update public.plans
set
  name = 'Zen Pro Yearly',
  note_limit = 2147483647,
  daily_create_limit = 2147483647,
  tier = 'pro',
  billing_interval = 'yearly',
  monthly_price_usd_cents = null,
  yearly_price_usd_cents = 4788,
  max_tags_per_note = null,
  can_password_share = false,
  can_customize_share = true,
  can_use_lora_share_font = true,
  can_hide_share_branding = false,
  can_hide_share_metadata = false,
  can_use_advanced_focus = true,
  can_access_priority_support = false,
  phase2_pdf_export_ready = true,
  phase2_version_history_ready = true,
  phase2_password_share_ready = false,
  phase2_share_expiration_ready = false
where id = 'premium_yearly';

insert into public.plans (
  id,
  name,
  note_limit,
  daily_create_limit,
  version_retention_days,
  can_password_share,
  can_customize_share,
  tier,
  billing_interval,
  monthly_price_usd_cents,
  yearly_price_usd_cents,
  max_tags_per_note,
  can_use_lora_share_font,
  can_hide_share_branding,
  can_hide_share_metadata,
  can_use_advanced_focus,
  can_access_priority_support,
  phase2_pdf_export_ready,
  phase2_version_history_ready,
  phase2_password_share_ready,
  phase2_share_expiration_ready
)
values
  (
    'studio_monthly',
    'Zen Studio Monthly',
    2147483647,
    2147483647,
    365,
    false,
    true,
    'studio',
    'monthly',
    1199,
    null,
    null,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ),
  (
    'studio_yearly',
    'Zen Studio Yearly',
    2147483647,
    2147483647,
    365,
    false,
    true,
    'studio',
    'yearly',
    null,
    11508,
    null,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  note_limit = excluded.note_limit,
  daily_create_limit = excluded.daily_create_limit,
  version_retention_days = excluded.version_retention_days,
  can_password_share = excluded.can_password_share,
  can_customize_share = excluded.can_customize_share,
  tier = excluded.tier,
  billing_interval = excluded.billing_interval,
  monthly_price_usd_cents = excluded.monthly_price_usd_cents,
  yearly_price_usd_cents = excluded.yearly_price_usd_cents,
  max_tags_per_note = excluded.max_tags_per_note,
  can_use_lora_share_font = excluded.can_use_lora_share_font,
  can_hide_share_branding = excluded.can_hide_share_branding,
  can_hide_share_metadata = excluded.can_hide_share_metadata,
  can_use_advanced_focus = excluded.can_use_advanced_focus,
  can_access_priority_support = excluded.can_access_priority_support,
  phase2_pdf_export_ready = excluded.phase2_pdf_export_ready,
  phase2_version_history_ready = excluded.phase2_version_history_ready,
  phase2_password_share_ready = excluded.phase2_password_share_ready,
  phase2_share_expiration_ready = excluded.phase2_share_expiration_ready;

update public.profiles
set
  tier = coalesce(
    (
      select p.tier
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = profiles.id
        and s.status in ('active', 'trialing', 'past_due')
      order by s.created_at desc
      limit 1
    ),
    'free'
  ),
  stripe_customer_id = (
    select s.provider_customer_id
    from public.subscriptions s
    where s.user_id = profiles.id
    order by s.created_at desc
    limit 1
  ),
  stripe_subscription_status = (
    select s.status
    from public.subscriptions s
    where s.user_id = profiles.id
    order by s.created_at desc
    limit 1
  ),
  current_period_end = (
    select s.current_period_end
    from public.subscriptions s
    where s.user_id = profiles.id
    order by s.created_at desc
    limit 1
  );
