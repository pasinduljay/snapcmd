# Snapcmd

[![Latest release](https://img.shields.io/github/v/release/pasinduljay/snapcmd?label=latest)](https://github.com/pasinduljay/snapcmd/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/pasinduljay/snapcmd/total)](https://github.com/pasinduljay/snapcmd/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6)](https://github.com/pasinduljay/snapcmd/releases/latest)

A personal command and snippet manager for Windows.

If you work with Docker, Kubernetes, Linux, AWS, or Windows day to day, you
already have a mental list of commands you reach for constantly — and
probably a few you always have to look up again. Snapcmd is a small, fast
desktop app for keeping that list somewhere searchable, so copying the
right command takes a couple of seconds instead of a trip back to your
shell history or a search engine.

It runs entirely on your machine. No account, no sign-in, no internet
connection required — your snippets live in a local database and never
leave your computer unless you choose to export them.

## Features

- **Search** across titles, commands, notes, and tags
- **Categories** you can create, rename, and delete freely
- **Placeholders** — write a command like `taskkill /PID {pid} /F` and
  Snapcmd prompts for the value before copying, instead of you editing it
  by hand every time
- **One-click copy**
- **Backups** — snapshot all or selected categories, restore them later if
  anything gets lost
- **Import/export** as JSON
- **Light and dark themes**, light by default
- **Auto-updates** — checks once on launch, installs only when you choose to

## Download

Get the latest installer from the
[Releases page](https://github.com/pasinduljay/snapcmd/releases/latest):

- **`Snapcmd_x64-setup.exe`** — the standard installer, recommended for
  most people
- **`Snapcmd_x64_en-US.msi`** — for silent/managed installs (e.g. via group
  policy)

Either one sets up a Start Menu entry, a desktop shortcut, and a normal
uninstaller under "Apps & Features." After that, Snapcmd looks after
itself — it checks for new versions on launch and lets you install them
with one click.

## Building from source

Built with [Tauri](https://tauri.app) — a React frontend running in
Windows' built-in WebView2, not a bundled browser like Electron, so the
installer stays a few megabytes and the app itself uses well under 30MB of
memory.

**Prerequisites** (one-time setup on your machine):

- [Rust](https://www.rust-lang.org/tools/install) via `rustup`
- Microsoft C++ Build Tools, via
  [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) —
  select the **"Desktop development with C++"** workload. If `cargo build`
  fails with `cannot open input file 'kernel32.lib'`, the Windows SDK
  wasn't included automatically; open the Visual Studio Installer → Modify,
  and add a Windows 10/11 SDK component explicitly.
- Build from **PowerShell**, not Git Bash — Git for Windows ships its own
  `link` utility that shadows MSVC's `link.exe` on PATH and produces a
  confusing "extra operand" error that has nothing to do with your code.

**Run it:**

```
npm install
npm run tauri dev
```

**Build an installer:**

```
npm run tauri build
```

Output lands in `src-tauri/target/release/bundle/`. The first compile
takes roughly 10 minutes (every Rust dependency builds from scratch);
after that, builds are incremental and much faster. You don't need any
signing key for local builds — that's CI-only, see below.

## How releases work

1. Bump the `version` field in `package.json` (and keep
   `src-tauri/tauri.conf.json`'s version in sync).
2. Push to `main`.

A GitHub Actions workflow takes it from there: builds the installer on a
real Windows runner, signs it, and publishes a GitHub Release with both
installer files, a signed update manifest, auto-generated release notes,
and the source code. Every existing install picks up the new version the
next time it checks.

## Roadmap

- Linux build
