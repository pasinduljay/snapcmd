# Snapcmd

Snapcmd is a personal command and snippet manager for Windows. It stores
the commands you use often — Docker, Kubernetes, Linux, Windows, AWS, and
anything else — in one searchable place, organized by category, so you can
find and copy them instead of looking them up again every time.

It's a fully offline desktop app: no account, no internet connection
required, no cloud service in the loop. Everything is stored in a local
SQLite database on your own machine.

## Features

- Search across titles, commands, notes, and tags
- Categories that can be created, renamed, and deleted
- Placeholder fields in commands (e.g. `taskkill /PID {pid} /F`) that prompt
  for a value before copying
- One-click copy
- Backup/restore snapshots, and import/export as JSON
- Light and dark mode (light by default)
- Checks for updates on launch, installs on your click — never silently

## Technology

Built with [Tauri](https://tauri.app): a React/Tailwind frontend running in
Windows' built-in WebView2 (not a bundled Chromium like Electron), backed
by a local SQLite database via Tauri's SQL plugin. Installers are a few MB;
the running app uses roughly 25MB of RAM.

## Running it locally

**Prerequisites** (one-time machine setup, not per-project):

- [Rust](https://www.rust-lang.org/tools/install) (`rustup`)
- Microsoft C++ Build Tools — via
  [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/),
  select the **"Desktop development with C++"** workload. The Windows SDK
  doesn't always get included automatically with that workload — if `cargo
  build` fails with `cannot open input file 'kernel32.lib'`, open the Visual
  Studio Installer → Modify, and explicitly add a Windows 10/11 SDK
  component.
- **Build from PowerShell, not Git Bash.** Git for Windows ships its own
  `link` utility that shadows MSVC's `link.exe` on PATH, which produces a
  confusing "extra operand" linker error that has nothing to do with your
  code.
- The very first `cargo build` compiles every Rust dependency from scratch
  (~10 minutes); after that, builds are incremental and much faster.

**Develop** (hot-reload, native window):

```
npm install
npm run tauri dev
```

**Build an installer** (no signing key needed locally — see below):

```
npm run tauri build
```

Produces an `.exe` (NSIS) and `.msi` (WiX) installer under
`src-tauri/target/release/bundle/`. Both are real installers — they
register a desktop shortcut, a Start Menu shortcut (which is how the app
becomes findable via Windows Search), and a proper uninstaller listed in
"Apps & Features".

## Releasing a new version

1. Bump the `version` field in `package.json` (keep `src-tauri/tauri.conf.json`'s
   version in sync too).
2. Push to `main`.

That's the only manual step. `.github/workflows/release-desktop.yml` then:

- Builds the installer on a real Windows runner
- Cryptographically signs the update files
- Publishes a GitHub Release tagged `v<version>` with the installer, the
  signed update manifest (`latest.json`), auto-generated release notes
  (grouped commits and contributors, GitHub's own Release Notes API), and
  the source code (GitHub attaches this to every tag automatically)

Existing installs pick up the new version the next time they check —
`UpdateBanner` checks once per launch and only installs on an explicit
click.

This requires two repository secrets — `TAURI_SIGNING_PRIVATE_KEY` and
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — from a keypair generated once via
`npx tauri signer generate`. The private key must **never** be committed;
only its corresponding `.pub` file (already in this repo, safe to be
public) is used to verify update signatures. Signing only happens in CI —
your local machine never needs the private key.

## Roadmap

Linux build support is planned.
