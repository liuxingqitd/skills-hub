# Custom Agent Paths Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users manage built-in and custom Agents by choosing each Agent's Skill folder path from the Agent management page.

**Architecture:** Keep the existing built-in registry as a default template, but make `config/agents.json` the editable user configuration. The server loads a normalized list of agents, expands paths in one place, validates folder status through a small API, and the settings UI edits the list directly.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, zod, Node fs/process APIs, Vitest, Testing Library.

---

### Task 1: Agent Config Model

**Files:**
- Modify: `src/types/agents.ts`
- Modify: `src/lib/config/agent-registry-store.ts`
- Modify: `src/lib/config/load-agents.ts`
- Test: `src/lib/config/agent-registry-store.test.ts`
- Test: `src/lib/config/load-agents.test.ts`

**Steps:**
- Add a v2 user config shape: `{ version: 2, agents: EditableAgentConfig[] }`.
- Keep legacy `{ enabledIds, customized }` support by merging registry entries into editable entries.
- Preserve `loadAgents()` and `loadAllRegistryAgents()` public behavior for the rest of the app.
- Add helpers for saving the full editable agent list and expanding common path variables.
- Remove Codex-specific path guessing from the runtime loading path; user-chosen paths are authoritative.

**Verification:**
- Legacy config still loads.
- Built-in registry entries become editable agents.
- Custom agents load and can be enabled.
- Disabled agents are excluded by `loadAgents()`.

### Task 2: Agent APIs

**Files:**
- Modify: `app/api/agents/route.ts`
- Create: `app/api/agents/validate-path/route.ts`
- Create: `app/api/system/select-directory/route.ts`
- Test: `app/api/agents/route.test.ts`

**Steps:**
- Change `POST /api/agents` to accept `{ agents }` and save the full config.
- Keep a legacy `{ enabledIds }` path for compatibility during tests or old clients.
- Add path validation that reports existence, directory access, and detected Skill count.
- Add a local folder picker endpoint using platform commands where possible, returning `{ path }`; if unavailable, return a clear failure for the UI fallback.

**Verification:**
- Saving agents invalidates overview cache.
- Path validation returns stable status values without throwing on missing paths.
- Folder picker failures are non-fatal and preserve manual path entry.

### Task 3: Settings UI

**Files:**
- Modify: `src/components/settings/settings-page.tsx`
- Modify: `app/globals.css`
- Test: `src/components/settings/settings-page.test.tsx`

**Steps:**
- Replace the Agent card toggle-only UI with editable rows.
- Add folder selection, detection, path input, enable switch, add custom Agent modal, and delete for custom agents.
- Save changes after toggles, path changes, folder selection, and custom Agent edits.
- Use compact operational styling consistent with the existing settings page.

**Verification:**
- Enabling an Agent saves the full agent list.
- Choosing a folder updates the path and triggers save.
- Adding a custom Agent creates a valid ID and persists it.
- Path status text is visible and resilient to API failures.

### Task 4: Final Validation

**Commands:**
- `npm test -- src/lib/config/agent-registry-store.test.ts src/lib/config/load-agents.test.ts app/api/agents/route.test.ts src/components/settings/settings-page.test.tsx`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`

**Acceptance:**
- A senior engineer can trace the config model without hidden override layers.
- Users can fix incorrect default paths by selecting a folder.
- Existing skill scan, sync, install, and overview behavior continue to consume `AgentDefinition[]`.
