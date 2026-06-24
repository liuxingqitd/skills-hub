import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

import type { InstructionPathSettings } from "@/src/lib/config/settings-store";
import type { InstructionAgent } from "@/src/types/instructions";

export type InstructionPathConfig = {
  claudePath: string;
  codexPath: string;
  hermesPath: string;
};

type RootOptions = {
  claudeRootDir?: string;
  codexRootDir?: string;
  hermesRootDir?: string;
};

export function defaultInstructionPaths(options: RootOptions = {}): InstructionPathConfig {
  const claudeRootDir = options.claudeRootDir || join(homedir(), ".claude");
  const codexRootDir = options.codexRootDir || process.env.CODEX_HOME || join(homedir(), ".codex");
  const hermesRootDir = options.hermesRootDir
    || process.env.HERMES_HOME
    || (process.platform === "win32" && process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, "hermes")
      : join(homedir(), ".hermes"));

  return {
    claudePath: join(claudeRootDir, "CLAUDE.md"),
    codexPath: join(codexRootDir, "AGENTS.md"),
    hermesPath: join(hermesRootDir, "AGENTS.md"),
  };
}

export function resolveInstructionPaths(
  overrides: InstructionPathSettings = {},
  options: RootOptions = {}
): InstructionPathConfig {
  const defaults = defaultInstructionPaths(options);
  return {
    claudePath: overrides.claude || defaults.claudePath,
    codexPath: overrides.codex || defaults.codexPath,
    hermesPath: overrides.hermes || defaults.hermesPath,
  };
}

export function rootDirForInstructionPath(path: string) {
  return dirname(path);
}

export function fileNameForInstructionPath(path: string) {
  return basename(path);
}

export function pathForAgent(paths: InstructionPathConfig, agent: InstructionAgent) {
  if (agent === "claude") return paths.claudePath;
  if (agent === "codex") return paths.codexPath;
  return paths.hermesPath;
}

export function agentForPath(paths: InstructionPathConfig, path: string): InstructionAgent | null {
  const resolvedPath = resolve(path);
  if (resolvedPath === resolve(paths.claudePath)) return "claude";
  if (resolvedPath === resolve(paths.codexPath)) return "codex";
  if (resolvedPath === resolve(paths.hermesPath)) return "hermes";
  return null;
}
