-- Primpaii's Way — initial schema.
-- Run once in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Safe to re-run: everything is additive (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- Every row belongs to one account (user_id) and Row Level Security only lets
-- the signed-in owner read or change their own rows.

create extension if not exists pgcrypto;

-- ── updated_at helper ────────────────────────────────────────────────────────
create or replace function public.pw_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  customer      text not null,
  application   text not null,           -- text snapshot
  plan          text not null,           -- text snapshot
  user_type     text not null,           -- text snapshot ("User" dropdown)
  duration_days integer not null check (duration_days > 0),
  fh_name       text not null default '',
  account_name  text not null default '',
  order_date    date not null,
  income        numeric(14, 2) not null default 0 check (income >= 0),
  expense       numeric(14, 2) not null default 0 check (expense >= 0),
  discount      numeric(14, 2) not null default 0 check (discount >= 0),
  notes         text not null default '',
  completed     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists orders_user_date_idx on public.orders (user_id, order_date desc);
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.pw_touch_updated_at();

-- ── warranties ───────────────────────────────────────────────────────────────
create table if not exists public.warranties (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  order_id             uuid,
  customer             text not null,
  application          text not null default '',
  user_type            text not null default '',
  plan                 text not null default '',
  active_duration_days integer not null default 0,
  order_date           date,
  report_at            timestamptz not null,
  warranty_end_at      timestamptz not null,
  issue                text not null default '',
  resolved             boolean not null default false,
  history              jsonb not null default '[]'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- Same-owner link only; deleting the order keeps the report and clears the link.
  constraint warranties_order_fk foreign key (order_id, user_id)
    references public.orders (id, user_id) on delete set null (order_id)
);
create index if not exists warranties_user_report_idx on public.warranties (user_id, report_at desc);
drop trigger if exists warranties_touch on public.warranties;
create trigger warranties_touch before update on public.warranties
  for each row execute function public.pw_touch_updated_at();

-- ── custom dropdown options ──────────────────────────────────────────────────
create table if not exists public.custom_options (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category   text not null check (category in ('application', 'plan', 'user')),
  name       text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);
create unique index if not exists custom_options_unique_name
  on public.custom_options (user_id, category, lower(btrim(name)));

-- ── playlist ─────────────────────────────────────────────────────────────────
create table if not exists public.playlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null,
  artist     text not null default '',
  source     text not null check (source in ('audio', 'spotify', 'youtube')),
  url        text not null,
  favorite   boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists playlist_user_pos_idx on public.playlist_items (user_id, position);

-- ── per-account settings ─────────────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  appearance      jsonb not null default '{}'::jsonb,
  apps_script_url text not null default '',
  updated_at      timestamptz not null default now()
);
drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.pw_touch_updated_at();

-- ── Row Level Security: owner-only access ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['orders', 'warranties', 'custom_options', 'playlist_items', 'user_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner can manage own rows" on public.%I', t);
    execute format(
      'create policy "owner can manage own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
