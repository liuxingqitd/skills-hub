import { homedir } from "node:os";

import {
  readAgentRegistry,
  readEnabledAgentIds,
} from "@/src/lib/config/agent-registry-store";
import type { AgentDefinition } from "@/src/types/agents";

function expandPath(p: string): string {
  const home = homedir();
  return p
    .replace(/^\$HOME/, home)
    .replace(/^~/, home)
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
  const [registry, enabledIds] = await Promise.all([
    readAgentRegistry(),
    readEnabledAgentIds(),
  ]);
  const enabledSet = new Set(enabledIds);

  return registry
    .filter((entry) => enabledSet.has(entry.id))
    .map((entry) => ({
      ...entry,
      enabled: true,
      skillsPath: expandPath(entry.skillsPath),
    }));
}

export async function loadAllRegistryAgents(): Promise<AgentDefinition[]> {
  const [registry, enabledIds] = await Promise.all([
    readAgentRegistry(),
    readEnabledAgentIds(),
  ]);
  const enabledSet = new Set(enabledIds);

  return registry.map((entry) => ({
    ...entry,
    enabled: enabledSet.has(entry.id),
    skillsPath: expandPath(entry.skillsPath),
  }));
}
