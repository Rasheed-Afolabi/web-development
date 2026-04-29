create extension if not exists pgcrypto;

create table if not exists public.app_snapshots (
  id uuid primary key default gen_random_uuid(),
  instance_id text not null unique,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

drop policy if exists "Public read snapshots" on public.app_snapshots;
create policy "Public read snapshots"
on public.app_snapshots
for select
using (true);

drop policy if exists "Public insert snapshots" on public.app_snapshots;
create policy "Public insert snapshots"
on public.app_snapshots
for insert
with check (true);

drop policy if exists "Public update snapshots" on public.app_snapshots;
create policy "Public update snapshots"
on public.app_snapshots
for update
using (true)
with check (true);