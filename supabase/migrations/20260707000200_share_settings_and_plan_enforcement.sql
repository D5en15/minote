alter table public.share_links
  add column if not exists font_family text not null default 'poppins'
    check (font_family in ('poppins', 'lora')),
  add column if not exists show_branding boolean not null default true,
  add column if not exists show_theme_toggle boolean not null default true,
  add column if not exists show_created_at boolean not null default true;

update public.share_links
set
  font_family = coalesce(font_family, 'poppins'),
  show_branding = coalesce(show_branding, true),
  show_theme_toggle = coalesce(show_theme_toggle, true),
  show_created_at = coalesce(show_created_at, true);
