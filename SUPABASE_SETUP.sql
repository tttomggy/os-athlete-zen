-- Run this once in your Supabase project: SQL Editor -> New query -> Run
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('swim','gym','fuel','recovery')),
  title text not null,
  details text[] not null default '{}',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.entries to anon;
grant select, insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;

alter table public.entries enable row level security;

-- Single-user personal app: open access via the publishable key.
create policy "entries readable" on public.entries for select using (true);
create policy "entries insertable" on public.entries for insert with check (true);
create policy "entries deletable" on public.entries for delete using (true);

create index if not exists entries_created_at_idx on public.entries (created_at desc);

-- Live timeline updates
alter publication supabase_realtime add table public.entries;
