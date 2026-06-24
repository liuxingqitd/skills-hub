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
    expect(settings.instructionPaths).toEqual({});
  });

  it("writeSettings persists and readSettings returns updated values", async () => {
    const raw = await readRawSettings();
    if (raw) originalContent = JSON.stringify(raw);
    else originalContent = null;

    const { readSettings, writeSettings } = await import("@/src/lib/config/settings-store");

    await writeSettings({
      syncMode: "symlink",
      instructionPaths: { codex: "/tmp/custom/AGENTS.md" },
    });
    const settings = await readSettings();
    expect(settings.syncMode).toBe("symlink");
    expect(settings.instructionPaths.codex).toBe("/tmp/custom/AGENTS.md");
  });
});
