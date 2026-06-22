# Desktop Packaging Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make desktop packaging commands explicit and remove the current macOS bundle identifier warning.

**Architecture:** Keep Tauri as the single desktop packaging layer. Add narrowly scoped npm scripts for app-only, dmg, and Windows installer targets so validation can distinguish app generation from installer packaging failures.

**Tech Stack:** Tauri 2, Rust, Next.js static export, npm scripts.

---

### Task 1: Fix macOS Bundle Identifier Warning

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Steps:**
- Change the Tauri identifier from `com.skillshub.app` to `com.skillshub.desktop`.
- Keep product name, app version, window settings, and bundle targets unchanged.

**Verification:**
- `npx tauri build --bundles app` no longer emits the `.app` suffix identifier warning.

### Task 2: Add Targeted Desktop Build Scripts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**
- Keep `desktop:build` as the full default Tauri build.
- Add `desktop:build:app` for macOS `.app` bundle validation.
- Add `desktop:build:dmg` for macOS DMG packaging validation.
- Add `desktop:build:windows` for Windows `nsis` and `msi` targets when run on Windows or a configured Windows CI runner.

**Verification:**
- `npm run desktop:build:app` succeeds on macOS.
- `npm run desktop:build:dmg` exposes any local `hdiutil` packaging issue separately from app generation.

### Task 3: Record Packaging Status

**Files:**
- Modify: `tasks/todo.md`

**Steps:**
- Document that macOS `.app` builds successfully.
- Document that DMG packaging currently fails in this environment with `hdiutil: create failed - 设备未配置`.
- Document that Windows installers require Windows or a configured Windows CI runner.

**Verification:**
- `npm test`
- `npx tsc --noEmit`
- `npm run build:desktop-web`
- `npm run desktop:build:app`
- `git diff --check`
