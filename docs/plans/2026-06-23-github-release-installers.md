# GitHub Release Installers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish unsigned macOS and Windows desktop installers through GitHub Releases so users can install Skills Hub without running npm commands.

**Architecture:** Use GitHub Actions with Tauri's official release action. A tag push creates or updates one GitHub Release, while macOS and Windows matrix jobs build platform-native bundles and upload them as release assets.

**Tech Stack:** GitHub Actions, Tauri 2, Node.js/npm, Rust stable, Next.js static export.

---

### Task 1: Add Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Steps:**
1. Create a workflow triggered by `push` tags matching `v*` and `workflow_dispatch`.
2. Grant `contents: write` so the workflow can create releases and upload assets.
3. Use a matrix with `macos-latest` and `windows-latest`.
4. Install Node.js LTS with npm cache, install Rust stable, run `npm ci`, then invoke `tauri-apps/tauri-action@v1`.
5. Build macOS with `--bundles dmg` and Windows with `--bundles nsis,msi`.
6. Set release body text that clearly states the installers are unsigned.

### Task 2: Document User-Facing Release Behavior

**Files:**
- Modify: `README.md`

**Steps:**
1. Add a desktop installer section near Quick Start.
2. Explain that GitHub Releases contain macOS and Windows installers.
3. Explain that the builds are unsigned and may trigger first-run security warnings.
4. Add a short maintainer command for publishing a release tag.

### Task 3: Track Progress

**Files:**
- Modify: `tasks/todo.md`

**Steps:**
1. Add the spec, task checklist, verification criteria, and review notes.
2. Mark tasks as they are completed.

### Task 4: Verify Locally

**Commands:**
- `npm test`
- `npx tsc --noEmit`
- `npm run build:desktop-web`
- `git diff --check`

**Expected Result:** All local checks pass. Full macOS/Windows installer generation is verified by GitHub Actions runners after a tag is pushed.
