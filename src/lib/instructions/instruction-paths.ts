import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

import type { InstructionPathSettings } from "@/src/lib/config/settings-store";
import type { InstructionAgent } from "@/src/types/instructions";

export type InstructionPathConfig = {
  claudePath: string;
  codexPath: string;
  hermesPath: string;
  pathsByAgent: Record<string, string>;
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

  const claudePath = join(claudeRootDir, "CLAUDE.md");
  const codexPath = join(codexRootDir, "AGENTS.md");
  const hermesPath = join(hermesRootDir, "AGENTS.md");
  const pathsByAgent = { claude: claudePath, codex: codexPath, hermes: hermesPath };

  return {
    claudePath,
    codexPath,
    hermesPath,
    pathsByAgent,
  };
}

export function resolveInstructionPaths(
  overrides: InstructionPathSettings = {},
  options: RootOptions = {}
): InstructionPathConfig {
  const defaults = defaultInstructionPaths(options);
  const pathsByAgent = {
    ...defaults.pathsByAgent,
    ...overrides,
    claude: overrides.claude || defaults.claudePath,
    codex: overrides.codex || defaults.codexPath,
    hermes: overrides.hermes || defaults.hermesPath,
  };

  return {
    claudePath: overrides.claude || defaults.claudePath,
    codexPath: overrides.codex || defaults.codexPath,
    hermesPath: overrides.hermes || defaults.hermesPath,
    pathsByAgent,
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
  if (agent === "hermes") return paths.hermesPath;
  return paths.pathsByAgent[agent];
}

export function agentForPath(paths: InstructionPathConfig, path: string): InstructionAgent | null {
  const resolvedPath = resolve(path);
  for (const [agent, agentPath] of Object.entries(paths.pathsByAgent)) {
    if (resolvedPath === resolve(agentPath)) return agent;
  }
  return null;
}
