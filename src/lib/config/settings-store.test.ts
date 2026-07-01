import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SETTINGS_PATH = resolve(process.cwd(), "config", "settings.json");

async function readRawSettings() {
  const { readFile } = await import("node:fs/promises");
  try {
    return JSON.parse(await readFile(SETTINGS_PATH, "utf-8"));
  } catch {
    return null;
  }
}

describe("settings-store", () => {
  let originalContent: string | null = null;

  afterEach(async () => {
    if (originalContent) {
      await writeFile(SETTINGS_PATH, originalContent, "utf-8");
    } else {
      await rm(SETTINGS_PATH, { force: true });
    }
  });

  it("readSettings returns defaults when file is missing", async () => {
    originalContent = JSON.stringify(await readRawSettings());

    await rm(SETTINGS_PATH, { force: true });

    // Re-import to bypass module cache
    const { readSettings } = await import("@/src/lib/config/settings-store");
    const settings = await readSettings();
    expect(settings.syncMode).toBe("copy");
    expect(settings.language).toBe("system");
    expect(settings.instructionPaths).toEqual({});
  });

  it("writeSettings persists and readSettings returns updated values", async () => {
    const raw = await readRawSettings();
    if (raw) originalContent = JSON.stringify(raw);
    else originalContent = null;

    const { readSettings, writeSettings } = await import("@/src/lib/config/settings-store");

    await writeSettings({
      syncMode: "symlink",
      language: "en",
      instructionPaths: { codex: "/tmp/custom/AGENTS.md" },
    });
    const settings = await readSettings();
    expect(settings.syncMode).toBe("symlink");
    expect(settings.language).toBe("en");
    expect(settings.instructionPaths.codex).toBe("/tmp/custom/AGENTS.md");
  });

  it("preserves custom agent instruction paths", async () => {
    const raw = await readRawSettings();
    if (raw) originalContent = JSON.stringify(raw);
    else originalContent = null;

    const { readSettings, writeSettings } = await import("@/src/lib/config/settings-store");

    await writeSettings({
      syncMode: "copy",
      language: "zh",
      instructionPaths: {
        " openclaw ": " /tmp/openclaw/AGENTS.md ",
        codex: "/tmp/codex/AGENTS.md",
        empty: " ",
      },
    });

    const settings = await readSettings();
    expect(settings.instructionPaths).toEqual({
      openclaw: "/tmp/openclaw/AGENTS.md",
      codex: "/tmp/codex/AGENTS.md",
    });
  });

  it("normalizes invalid or old missing language values to system", async () => {
    const raw = await readRawSettings();
    if (raw) originalContent = JSON.stringify(raw);
    else originalContent = null;

    await writeFile(
      SETTINGS_PATH,
      JSON.stringify({ syncMode: "copy", language: "fr", instructionPaths: {} }),
      "utf-8"
    );

    const { readSettings } = await import("@/src/lib/config/settings-store");
    const settings = await readSettings();
    expect(settings.language).toBe("system");
  });

  it("persists system language preference", async () => {
    const raw = await readRawSettings();
    if (raw) originalContent = JSON.stringify(raw);
    else originalContent = null;

    const { readSettings, writeSettings } = await import("@/src/lib/config/settings-store");

    await writeSettings({
      syncMode: "copy",
      language: "system",
      instructionPaths: {},
    });

    const settings = await readSettings();
    expect(settings.language).toBe("system");
  });
});
