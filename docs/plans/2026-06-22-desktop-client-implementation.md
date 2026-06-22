# Desktop Client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the long-term macOS and Windows desktop client foundation for Skills Hub.

**Architecture:** Use Tauri 2 as the native desktop shell, React/Next as a static UI bundle, and Rust commands as the future local capability layer. Keep the current Next development server untouched for web iteration, while adding a desktop-specific static export path for Tauri production builds.

**Tech Stack:** Tauri 2, Rust, Next.js 15, React 19, TypeScript, Tailwind CSS v4, Vitest.

---

### Task 1: Desktop Shell Skeleton

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/main.rs`
- Modify: `.gitignore`

**Steps:**
- Add a minimal Tauri 2 Rust crate named `skills-hub`.
- Configure the app identifier, product name, main window, macOS DMG target, and Windows NSIS/MSI targets.
- Point Tauri dev mode to `http://localhost:3000`.
- Point Tauri production mode to Next's `out/` directory.
- Add the default Tauri capability file with core permissions only.
- Ignore Rust/Tauri build output without hiding source files.

**Verification:**
- `src-tauri` is self-contained and can be opened by Cargo.
- The desktop shell has no Node sidecar dependency.
- The config is explicit about app name, identifier, dev URL, and static frontend output.

### Task 2: Desktop Build Scripts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**
- Add Tauri dependencies through npm so contributors get reproducible CLI versions.
- Add `tauri`, `desktop:dev`, `desktop:build`, and `build:desktop-web` scripts.
- Keep existing `dev`, `build`, `start`, `lint`, and `test` behavior unchanged.

**Verification:**
- `npm run dev` still starts plain Next on port 3000.
- `npm run build` still performs the normal Next server build.
- `npm run build:desktop-web` performs a static export build for Tauri.
- `npm run desktop:dev` starts Tauri with the existing dev server URL.

### Task 3: Static Export Switch

**Files:**
- Modify: `next.config.ts`

**Steps:**
- Gate static export behind `SKILLS_HUB_DESKTOP=1`.
- When enabled, set `output: "export"` and `images.unoptimized = true`.
- Leave typed routes, output file tracing, and dev polling behavior intact.

**Verification:**
- Normal Next build remains server-capable for the current App Router code.
- Desktop web build has a deterministic `out/` output path.
- The switch makes later API/server-component migration visible instead of silently changing the current app mode.

### Task 4: First Validation

**Commands:**
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `npm run build:desktop-web`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `git diff --check`

**Acceptance:**
- Existing web app behavior is preserved.
- Tauri shell configuration is valid enough for Cargo/Tauri tooling to parse.
- Any static export blockers are documented as migration work instead of hidden.
- A senior engineer can see the intended path from current Next API routes to future Rust commands.

### Later Migration Milestones

- Move skill scanning, hashing, sync planning, and instruction reads into Rust modules behind `tauri::command`.
- Replace client fetches to `/api/*` with a typed desktop bridge that can call either HTTP or Tauri commands during the transition.
- Move runtime config from repository `config/` files into OS app data directories.
- Add native folder picker flows for agent and source-skill path selection.
- Add macOS signing/notarization and Windows code-signing automation before public distribution.

### Current Validation Notes

- `npm test`, `npx tsc --noEmit`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check` pass after the first desktop scaffold.
- `npm run build:desktop-web` fails because the current App Router `/api/*` route handlers are not compatible with Next static export. This is the correct next migration boundary: those local file-system operations should move behind Tauri commands or a temporary desktop bridge before production Tauri builds are expected to pass.
