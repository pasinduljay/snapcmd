-- Snapcmd — public share links

alter table public.snippets
  add column share_slug text unique;

-- Anyone (including anonymous visitors) can read a snippet ONLY if it has
-- a share_slug set. Rows with share_slug = null stay fully private —
-- this policy is OR'ed with the existing owner-only policy, it doesn't replace it.
create policy "Anyone can read shared snippets"
  on public.snippets for select
  using (share_slug is not null);
