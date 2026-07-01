# Client I18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Chinese/English client internationalization with a real system-following language mode.

**Architecture:** Keep the existing lightweight React context and in-file dictionaries. Store language preference as `system | zh | en`; resolve `system` from `navigator.languages` on load and on `languagechange`.

**Tech Stack:** Next.js App Router, React client context, TypeScript, Vitest, Testing Library.

---

### Task 1: Settings Data Model

**Files:**
- Modify: `src/lib/config/settings-store.ts`
- Modify: `app/api/settings/route.ts`
- Test: `src/lib/config/settings-store.test.ts`
- Test: `app/api/settings/route.test.ts`

**Steps:**
- Add `LanguagePreference = "system" | "zh" | "en"`.
- Keep `Language = "zh" | "en"` for resolved display language.
- Normalize old `null` or invalid values to `"system"`.
- Allow `/api/settings` to save `"system"`.
- Update tests for defaults, invalid values, and system preference save.

### Task 2: I18n Provider

**Files:**
- Modify: `src/lib/i18n.tsx`
- Test: `src/lib/i18n.test.tsx`

**Steps:**
- Track both `languagePreference` and resolved `language`.
- Resolve `system` from `navigator.languages`; any `zh-*` uses Chinese, all other languages use English.
- Update `document.documentElement.lang`.
- Listen for `languagechange` only while preference is `system`.
- Add focused tests for default system detection, `languagechange`, and fixed-language behavior.

### Task 3: Settings UI

**Files:**
- Modify: `src/components/settings/settings-page.tsx`
- Test: `src/components/settings/settings-page.test.tsx`

**Steps:**
- Add a "Follow system" option.
- Save language preference through the provider.
- Keep existing manual Chinese/English choices.
- Update tests to expect `system` where appropriate.

### Task 4: Verification

**Commands:**
- `npm test -- src/lib/config/settings-store.test.ts app/api/settings/route.test.ts src/lib/i18n.test.tsx src/components/settings/settings-page.test.tsx src/components/editor/editor-page.test.tsx`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`

**Expected:** Tests, type check, build, and whitespace check pass.
