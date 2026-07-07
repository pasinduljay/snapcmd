-- Snapcmd — core snippets table

create table public.snippets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  command    text not null,
  notes      text not null default '',
  category   text not null default 'General',
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index snippets_user_id_idx on public.snippets (user_id);

-- Row Level Security: every user can only ever see and touch their own rows.
-- This is what makes the app safe to publish to other people.
alter table public.snippets enable row level security;

create policy "Users can read own snippets"
  on public.snippets for select
  using (auth.uid() = user_id);

create policy "Users can insert own snippets"
  on public.snippets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own snippets"
  on public.snippets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own snippets"
  on public.snippets for delete
  using (auth.uid() = user_id);
