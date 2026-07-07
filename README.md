# Snapcmd

Snapcmd is a personal command and snippet manager. It stores the commands you
use often — Docker, Kubernetes, Linux, Windows, AWS, and anything else — in
one searchable place, organized by category, so you can find and copy them
instead of looking them up again every time.

A browser extension is planned for the future, so snippets will also be
reachable without opening the website.

## Features

- Search across titles, commands, notes, and tags
- Categories that can be created, renamed, and deleted
- Placeholder fields in commands (e.g. `taskkill /PID {pid} /F`) that prompt
  for a value before copying
- One-click copy
- Public share links for individual snippets
- Import and export as JSON
- Light and dark mode (light by default)

## Technology

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Supabase (Postgres database, authentication, and access control)
- **Hosting:** Vercel
- **Automation:** GitHub Actions applies database changes automatically

## Deploying your own copy

Follow these steps in order if you are setting this project up for the first
time, or setting it up again after deleting a previous Supabase project.

**1. Fork this repository** to your own GitHub account.

**2. Create a Supabase project.**

Go to [supabase.com](https://supabase.com), create a project, and collect
these five things from the dashboard:

| What | Where to find it |
|---|---|
| Project URL | Project Settings → API |
| Publishable key | Project Settings → API |
| Project reference (ID) | Project Settings → General |
| Database password | Set when you create the project |
| Personal access token | Account settings → Access Tokens |

**3. Add GitHub repository secrets.**

In your forked repository, go to **Settings → Secrets and variables →
Actions → New repository secret**, and add:

| Secret name | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | the personal access token from step 2 |
| `SUPABASE_DB_PASSWORD` | the database password from step 2 |
| `SUPABASE_PROJECT_REF` | the project reference from step 2 |

**4. Set up the database.**

Go to the **Actions** tab of your repository, select **Apply database
migrations**, and click **Run workflow**. This creates all the required
tables and access rules on your new Supabase project automatically. You do
not need to write or run any SQL yourself.

From this point on, any future database change added to this project applies
automatically the next time it's pushed to the `main` branch — this step only
needs to be done manually once, for a brand-new database.

**5. Deploy to Vercel.**

- Go to [vercel.com](https://vercel.com) and import your forked repository.
- Set **Root Directory** to `webapp`.
- Add two environment variables:
  - `VITE_SUPABASE_URL` — the Project URL from step 2
  - `VITE_SUPABASE_ANON_KEY` — the Publishable key from step 2
- Click **Deploy**.

**6. Use the app.**

Open the URL Vercel gives you and sign up with an email address. From now
on, every time you push a change to `main`, Vercel redeploys automatically.

## Running the project locally

1. Clone your fork:

   ```
   git clone https://github.com/<your-username>/snapcmd.git
   cd snapcmd/webapp
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create your environment file:

   ```
   copy .env.example .env
   ```

   Open `.env` and fill in the two values from your Supabase project:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-key
   ```

4. Start the app:

   ```
   npm run dev
   ```

   Open the address shown in the terminal (usually http://localhost:5173).

## Backups

Supabase's free plan does not include automatic backups. This repository
includes a scheduled backup workflow (`.github/workflows/backup.yml`) that
copies the database to a Cloudflare R2 bucket once a day. To turn it on:

1. Create a bucket in Cloudflare R2, and an API token scoped to that bucket.
2. Add these additional GitHub repository secrets:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`

The three Supabase secrets from the deployment steps above are reused for
this, so no extra Supabase information is needed.
