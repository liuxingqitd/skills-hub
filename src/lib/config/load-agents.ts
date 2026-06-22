import { homedir } from "node:os";
import { join } from "node:path";

import {
  readEditableAgentsConfig,
  readAgentSelection,
  readAgentRegistry,
} from "@/src/lib/config/agent-registry-store";
import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";
import type { AgentDefinition } from "@/src/types/agents";

type CodexPathResolverOptions = {
  platform?: NodeJS.Platform;
  extraCandidates?: string[];
};

export function expandAgentPath(p: string): string {
  const home = homedir();
  return p
    .replace(/^\$HOME/, home)
    .replace(/^~/, home)
    .replace(/%USERPROFILE%/gi, process.env.USERPROFILE || home)
    .replace(/%LOCALAPPDATA%/gi, process.env.LOCALAPPDATA || join(home, "AppData", "Local"))
    .replace(/\$CODEX_HOME/g, () => process.env.CODEX_HOME || join(home, ".codex"))
    .replace(/\$HERMES_HOME/g, () => {
      if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
      if (process.platform === "win32" && process.env.LOCALAPPDATA) {
        return `${process.env.LOCALAPPDATA}\\hermes`;
      }
      return `${home}/.hermes`;
    })
    .replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, name) => process.env[name] ?? _);
}

export async function loadAgents(): Promise<AgentDefinition[]> {
  const agents = await loadAllRegistryAgents();

  return agents
    .filter((agent) => agent.enabled)
    .map((agent) => ({ ...agent, enabled: true }));
}

export async function loadAllRegistryAgents(): Promise<AgentDefinition[]> {
  const [registry, selection, editableAgents] = await Promise.all([
    readAgentRegistry(),
    readAgentSelection(),
    readEditableAgentsConfig(),
  ]);

  if (editableAgents) {
    return editableAgents.map(expandAgentDefinition);
  }

  const agents = registry.map((agent) =>
    expandAgentDefinition({ ...agent, enabled: false, builtin: true })
  );
  const activeIds = await resolveActiveAgentIds(agents, selection);

  return agents.map((agent) => ({
    ...agent,
    enabled: activeIds.has(agent.id),
  }));
}

function expandAgentDefinition(entry: AgentDefinition): AgentDefinition {
  const expandedSkillsPath = expandAgentPath(entry.skillsPath);
  return {
    ...entry,
    skillsPath: expandedSkillsPath,
  };
}

async function hasSkillDirs(skillsPath: string): Promise<boolean> {
  return (await discoverSkillDirs(skillsPath)).length > 0;
}

function windowsCodexSkillsPathCandidates(): string[] {
  const drives = new Set<string>();
  const systemDrive = process.env.SystemDrive?.match(/^[A-Za-z]:/i)?.[0].toUpperCase();
  if (systemDrive) {
    drives.add(systemDrive);
  }

  for (let code = "C".charCodeAt(0); code <= "Z".charCodeAt(0); code += 1) {
    drives.add(`${String.fromCharCode(code)}:`);
  }

  return [...drives].map((drive) => join(`${drive}\\`, ".codex", "skills"));
}

export async function resolveCodexSkillsPath(
  defaultSkillsPath: string,
  options: CodexPathResolverOptions = {}
): Promise<string> {
  if (process.env.CODEX_HOME) {
    return defaultSkillsPath;
  }

  if (await hasSkillDirs(defaultSkillsPath)) {
    return defaultSkillsPath;
  }

  const platform = options.platform ?? process.platform;
  const candidates = [
    ...(options.extraCandidates ?? []),
    ...(platform === "win32" ? windowsCodexSkillsPathCandidates() : []),
  ];

  for (const candidate of candidates) {
    if (candidate === defaultSkillsPath) {
      continue;
    }
    if (await hasSkillDirs(candidate)) {
      return candidate;
    }
  }

  return defaultSkillsPath;
}

async function hasDetectedSkills(agent: AgentDefinition): Promise<boolean> {
  const skills = await discoverSkillDirs(agent.skillsPath);
  return skills.length > 0;
}

export async function resolveActiveAgentIds(
  agents: AgentDefinition[],
  selection: { enabledIds: string[]; customized: boolean }
): Promise<Set<string>> {
  const activeIds = new Set(selection.enabledIds);
  if (selection.customized) {
    return activeIds;
  }

  const detected = await Promise.all(
    agents.map(async (agent) => [agent.id, await hasDetectedSkills(agent)] as const)
  );
  for (const [id, hasSkills] of detected) {
    if (hasSkills) {
      activeIds.add(id);
    }
  }

  return activeIds;
}
