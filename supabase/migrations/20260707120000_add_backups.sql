-- Snapcmd — in-app backup snapshots (per user, restorable from the UI)

create table public.backups (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  scope         text not null default 'All categories',
  snippet_count int not null default 0,
  data          jsonb not null,
  created_at    timestamptz not null default now()
);

create index backups_user_id_idx on public.backups (user_id);

alter table public.backups enable row level security;

create policy "Users can read own backups"
  on public.backups for select
  using (auth.uid() = user_id);

create policy "Users can create own backups"
  on public.backups for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own backups"
  on public.backups for delete
  using (auth.uid() = user_id);
