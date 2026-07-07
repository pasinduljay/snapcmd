# Snapcmd

Snapcmd is a personal command and snippet manager. It stores the commands you
use often — Docker, Kubernetes, Linux, Windows, AWS, and anything else — in
one searchable place, organized by category, so you can find and copy them
instead of looking them up again every time.

A Chrome extension (`extension/`) reads the same account, so snippets are
also reachable without opening the website. A Windows desktop app
(`desktop/`) is also available for fully offline, local-only use — no
account, no internet connection, everything stored on your own machine.

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
- **Backend (web + extension):** Supabase (Postgres database, authentication, access control)
- **Backend (desktop):** local SQLite via Tauri — no server, fully offline
- **Hosting:** Vercel
- **Automation:** GitHub Actions applies database changes and publishes releases automatically

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

3. Create your environment file (`cp` works in Git Bash/WSL/macOS/Linux; use
   `copy` instead if you're in Windows Command Prompt):

   ```
   cp .env.example .env
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

## Chrome extension

The extension (`extension/`) is a separate small app that talks to the same
Supabase project as the website — signing in there gives you the same
snippets, no separate account.

**Build and load it:**

```
cd extension
npm install
cp .env.example .env
```

(`copy` instead of `cp` in Windows Command Prompt.)

Fill in `.env` with the same two values as `webapp/.env`, then:

```
npm run build
```

In Chrome, go to `chrome://extensions`, turn on **Developer mode** (top
right), click **Load unpacked**, and select `extension/dist`. Click the
extension's icon to open the popup.

**Releases:** bump the `version` field in both `extension/package.json` and
`extension/public/manifest.json`, and push to `main`. A GitHub Actions
workflow (`release-extension.yml`) builds it, zips `dist/`, and publishes a
GitHub Release with auto-generated notes (grouped commits, contributors —
same format GitHub shows on any release page) and the zip attached. Needs
two more repository secrets, same values as `webapp/.env`:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase Publishable key |

**Email/password sign-in works immediately.** Google sign-in needs one-time
setup, same idea as the Resend setup earlier — external services only you
can configure:

1. In `chrome://extensions`, copy this extension's **ID** (a long string
   under its name, only appears once it's loaded).
2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth 2.0 Client ID** of type **Chrome Extension**, using
   that ID.
3. In Supabase dashboard → **Authentication → Providers → Google**, enable
   it and paste in the Client ID/Secret from step 2.
4. In Supabase dashboard → **Authentication → URL Configuration → Redirect
   URLs**, add `https://<extension-id>.chromiumapp.org/` (the same ID from
   step 1).

## Desktop app (Windows)

The desktop app (`desktop/`) is a completely separate, offline version —
no Supabase, no account, no internet connection required. It stores
everything in a local SQLite database on your own machine
(`%APPDATA%\com.snapcmd.app\snapcmd.db`). Same look, same features
(search, categories, placeholders, backup/restore snapshots, import/export)
minus the ones that only make sense with a server: public share links and
multi-device sync.

It's built with [Tauri](https://tauri.app), which wraps the same
React/Tailwind frontend used elsewhere in this repo in a native shell using
Windows' built-in WebView2 — not a bundled Chromium like Electron — so the
installer is a few MB instead of 150MB+.

**Prerequisites** (one-time machine setup, not per-project):

- [Rust](https://www.rust-lang.org/tools/install) (`rustup`)
- Microsoft C++ Build Tools — via
  [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/),
  "Desktop development with C++" workload

**Run it in development:**

```
cd desktop
npm install
npm run tauri dev
```

**Build a Windows installer:**

```
npm run tauri build
```

Produces an `.exe` (NSIS) and `.msi` installer under
`desktop/src-tauri/target/release/bundle/`.

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
