import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SyncMode = "copy" | "symlink";
export type Language = "zh" | "en";
export type LanguagePreference = "system" | Language;
export type InstructionAgentId = string;

export type InstructionPathSettings = Partial<Record<InstructionAgentId, string>>;

export type AppSettings = {
  syncMode: SyncMode;
  language: LanguagePreference;
  instructionPaths: InstructionPathSettings;
};

const SETTINGS_PATH = resolve(process.cwd(), "config", "settings.json");

const DEFAULTS: AppSettings = {
  syncMode: "copy",
  language: "system",
  instructionPaths: {},
};

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      language: normalizeLanguage(parsed.language),
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
      language: normalizeLanguage(settings.language),
      instructionPaths: normalizeInstructionPaths(settings.instructionPaths),
    }, null, 2) + "\n",
    "utf-8"
  );
}

function normalizeLanguage(language: unknown): LanguagePreference {
  return language === "zh" || language === "en" || language === "system" ? language : "system";
}

function normalizeInstructionPaths(paths: unknown): InstructionPathSettings {
  if (!paths || typeof paths !== "object") return {};

  const input = paths as Record<string, unknown>;
  const normalized: InstructionPathSettings = {};
  for (const [agent, value] of Object.entries(input)) {
    const normalizedAgent = agent.trim();
    if (!normalizedAgent) continue;
    if (typeof value === "string" && value.trim()) {
      normalized[normalizedAgent] = value.trim();
    }
  }
  return normalized;
}
