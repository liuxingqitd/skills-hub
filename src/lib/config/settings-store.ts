import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SyncMode = "copy" | "symlink";

export type AppSettings = {
  syncMode: SyncMode;
};

const SETTINGS_PATH = resolve(process.cwd(), "config", "settings.json");

const DEFAULTS: AppSettings = {
  syncMode: "copy",
};

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}
