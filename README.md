# Snapcmd

Personal command/snippet manager with cloud sync. Web app (this repo, `webapp/`) +
a planned Chrome extension (`extension/`, coming next) — both read the same
Supabase backend, so a snippet saved on the web app appears instantly in the
extension.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + [coss.com/ui](https://coss.com/ui) (Base UI components)
- **Backend:** Supabase (Postgres + Auth + auto REST API, free tier)
- **Theme:** Light mode by default (never follows the OS setting); dark mode
  via the toggle in the header, remembered per browser. Styled to match the
  Supabase dashboard aesthetic (flat, neutral, green accent).

## One-time setup

1. **Apply the database migrations** — see [Database migrations](#database-migrations) below.
   This creates the `snippets` and `categories` tables, row-level security, and
   the public share-link policy, without ever pasting SQL into the dashboard by hand.

2. **Get your API keys** — dashboard → *Project Settings* → *API*. You need:
   - Project URL (`https://xxxx.supabase.co`)
   - Publishable key (`sb_publishable_...`) — the modern equivalent of the old "anon" key

3. **Configure the web app:**

   ```
   cd webapp
   copy .env.example .env
   ```

   Edit `.env` and paste the two values in.

4. **Install & run:**

   ```
   npm install
   npm run dev
   ```

   Open http://localhost:5173, sign up with your email, confirm via the email
   Supabase sends you, and sign in.

   > Tip: to skip email confirmation while developing, dashboard →
   > *Authentication* → *Sign In / Up* → disable "Confirm email".

## Features

- Full-text search across title, command, notes, tags (`/` focuses the search box)
- Category chips with counts, horizontally scrollable; **Manage** dialog to rename/delete
  categories (deleted categories move their snippets to General)
- `{placeholder}` syntax in commands → fillable fields on the card before copying
  (e.g. `taskkill /PID {pid} /F`)
- One-click copy with confirmation
- Public share links — the Share icon on a card copies a read-only URL
  (`/s/<slug>`) anyone can open without an account
- Export / import snippets as JSON
- Light/dark toggle (light default)

## Database migrations

SQL lives as versioned files in `supabase/migrations/`, applied with the
[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
instead of pasting into the dashboard. This is what lets a deploy "just create
the tables it needs" — `supabase db push` applies whatever migrations the
remote database doesn't have yet, and does nothing if it's already up to date.

One-time link (run once per machine/CI environment):

```
npx supabase login
npx supabase link --project-ref bvjsckvdljweetxxrwck
```

`login` opens a browser to create a personal access token; `link` will prompt
for the project's **database password** (Project Settings → Database →
Reset database password if you don't have it saved — resetting is safe, it
doesn't affect existing data). Neither secret is stored in this repo.

Then, any time `supabase/migrations/` has new files:

```
npx supabase db push
```

To add a new migration later: create a new timestamped file in
`supabase/migrations/` (e.g. `20260710120000_add_pinning.sql`), then `db push`
again.

> If your database already has tables that a migration would recreate (e.g.
> you applied the very first version by hand before adopting this workflow),
> mark that migration as already applied instead of re-running it:
> `npx supabase migration repair --status applied <version>`.

## Backups

Supabase's **free tier does not include automatic backups** (daily backups
and point-in-time recovery are Pro-plan features) — so for a free project,
backups are your own responsibility. `.github/workflows/backup.yml` (added to
this repo) handles it on a schedule: it runs `supabase db dump`, gzips the
result, and uploads it to a Cloudflare R2 bucket (R2 has no egress fees, so
restoring later is free). To enable it:

1. Create an R2 bucket in the Cloudflare dashboard and an API token scoped to it
   (R2 → Manage API tokens).
2. In your GitHub repo → *Settings → Secrets and variables → Actions*, add:
   - `SUPABASE_ACCESS_TOKEN` — same personal access token from the migrations step
   - `SUPABASE_DB_PASSWORD` — the project's database password
   - `SUPABASE_PROJECT_REF` — `bvjsckvdljweetxxrwck`
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
3. The workflow runs daily; you can also trigger it manually from the Actions tab.

Old backups aren't auto-deleted — set a lifecycle rule on the R2 bucket
(Cloudflare dashboard → bucket → *Settings → Lifecycle rules*) if you want to
cap retention (e.g. delete objects older than 30 days).

## Deploying (Vercel)

No Docker, no CI pipeline to maintain — Vercel builds and deploys on every
`git push`, which is all this app needs since it's a static SPA talking
directly to Supabase.

1. Push this repo to GitHub.
2. In Vercel, **Add New Project** → import the repo.
3. Set **Root Directory** to `webapp` (the actual Vite project lives there,
   not the repo root).
4. Add the two environment variables (Project Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (same values as `webapp/.env`) — apply them to Production, Preview, and
   Development so branch/PR preview deployments work too.
5. Deploy. Vercel auto-detects Vite (build command `npm run build`, output
   `dist`) — no other config needed.

`webapp/vercel.json` adds the one thing Vercel doesn't infer automatically:
an SPA rewrite so a direct visit to a share link (`/s/abc123`) serves
`index.html` instead of 404ing, same as the nginx fallback would have done.

Every push to your main branch redeploys automatically; every other branch or
PR gets its own preview URL for free. Want a custom domain later (e.g. one you
already own via Cloudflare)? Add it in Vercel's Domains settings and point a
CNAME at it — no tunnel needed, Vercel handles HTTPS.
