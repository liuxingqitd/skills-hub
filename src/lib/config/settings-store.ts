import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SyncMode = "copy" | "symlink";
export type InstructionAgentId = "claude" | "codex" | "hermes";

export type InstructionPathSettings = Partial<Record<InstructionAgentId, string>>;

export type AppSettings = {
  syncMode: SyncMode;
  instructionPaths: InstructionPathSettings;
};

const SETTINGS_PATH = resolve(process.cwd(), "config", "settings.json");

const DEFAULTS: AppSettings = {
  syncMode: "copy",
  instructionPaths: {},
};

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      instructionPaths: normalizeInstructionPaths(parsed.instructionPaths),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await writeFile(
    SETTINGS_PATH,
    JSON.stringify({
      ...settings,
      instructionPaths: normalizeInstructionPaths(settings.instructionPaths),
    }, null, 2) + "\n",
    "utf-8"
  );
}

function normalizeInstructionPaths(paths: unknown): InstructionPathSettings {
  if (!paths || typeof paths !== "object") return {};

  const input = paths as Partial<Record<InstructionAgentId, unknown>>;
  const normalized: InstructionPathSettings = {};
  for (const agent of ["claude", "codex", "hermes"] as const) {
    const value = input[agent];
    if (typeof value === "string" && value.trim()) {
      normalized[agent] = value.trim();
    }
  }
  return normalized;
}
