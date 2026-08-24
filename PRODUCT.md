# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are individual developers who work with multiple AI coding agents and need one place to manage the skills and global instruction files installed across those tools.

## Product Purpose

Skills Hub is a local workspace for discovering, installing, organizing, comparing, and synchronizing AI agent skills. It also provides a single editor for the global instruction files used by supported agents. Success means users can understand the state of their local skill library at a glance and resolve differences without manually inspecting or copying files between agent directories.

## Positioning

Skills Hub is agent-agnostic and operates directly on the user's local filesystem. It treats configured skill directories and `SKILL.md` files as the source of truth, compares source and installed content with SHA-256 hashes, and turns the resulting state into explicit sync actions. It does not require a database or cloud storage.

## Operating Context

- The product is primarily distributed as a macOS and Windows desktop application, implemented with a Tauri shell around the web interface.
- Developers can also run the Next.js application locally at `http://localhost:3000` for development and browser-based iteration.
- Users connect the AI agents present on their machine by enabling built-in definitions or adding configurable agent directories.
- The main workflow is to scan local skill directories, review installation and synchronization status, then install, repair, synchronize, categorize, or remove skills.
- A separate workflow lets users locate and edit each agent's global instruction file with preview and guarded saving.

## Capabilities and Constraints

- Presents skills in unified card and list views with search, source/category filters, and per-agent installation state.
- Distinguishes synchronized, missing, drifted, conflicting, and orphaned skill states; synchronization repairs missing or drifted copies while conflicts are skipped and orphan cleanup remains explicit.
- Installs skills from GitHub repositories, SSH URLs, or local paths and discovers directories containing `SKILL.md`.
- Supports automatic categorization, manual categories, and custom/open-source labels.
- Allows users to enable built-in agents, add custom agents, validate skill paths, and configure global instruction-file paths.
- Supports Chinese, English, and following the operating system language.
- Uses local files as the only runtime data source; no database or cloud storage may be introduced without an explicit product decision.
- Current supported distribution targets are macOS and Windows. Mobile-native interfaces are not part of the confirmed product scope.
- The desktop client must retain direct local filesystem access. The web implementation and Tauri bridge may evolve, but filesystem-backed behavior is a durable constraint.

## Brand Commitments

- The product name is **Skills Hub**.
- User-facing language should be direct, practical, and developer-oriented rather than promotional.
- The product is open source under the MIT License.
- Chinese and English are both supported product languages.

## Evidence on Hand

- Product descriptions and supported workflows: `README.md` and `README.zh.md`.
- Current dashboard implementation: `src/components/dashboard/dashboard-page.tsx`.
- Current global-instructions editor: `src/components/editor/editor-page.tsx`.
- Agent definitions and local-path model: `config/agent-registry.json` and `src/types/agents.ts`.
- Sync state model: `src/types/skills.ts` and `src/lib/sync/`.
- Desktop platform configuration: `src-tauri/tauri.conf.json`.
- Existing interface reference: `screenshots/dashboard.png`.
- No confirmed testimonials, case studies, usage benchmarks, performance claims, or accessibility certification are present in the repository; future work must not fabricate them.

## Product Principles

1. Keep the filesystem legible: product state should remain inspectable through ordinary local files and directories.
2. Make cross-agent differences explicit before changing anything.
3. Prefer safe, reviewable synchronization actions over hidden automation.
4. Stay agent-agnostic through configurable paths and definitions rather than hard-coded vendor workflows.
5. Reduce repetitive file management without taking ownership away from the developer.
