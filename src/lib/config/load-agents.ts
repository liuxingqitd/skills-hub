import { homedir } from "node:os";

import agents from "@/config/agents.json";
import { z } from "zod";

import type { AgentDefinition } from "@/src/types/agents";

const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skillsPath: z.string().min(1),
  enabled: z.boolean()
});

function expandPath(p: string): string {
  const home = homedir();
  return p
    .replace(/^\$HOME/, home)
    .replace(/^~/, home)
    .replace(/\$HERMES_HOME/g, () => {
      if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
      // Fallback: on Windows, %LOCALAPPDATA%\hermes; elsewhere, ~/.hermes
      if (process.platform === "win32" && process.env.LOCALAPPDATA) {
        return `${process.env.LOCALAPPDATA}\\hermes`;
      }
      return `${home}/.hermes`;
    })
    .replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, name) => process.env[name] ?? _);
}

export async function loadAgents(): Promise<AgentDefinition[]> {
  return z
    .array(agentSchema)
    .parse(agents)
    .filter((agent) => agent.enabled)
    .map((agent) => ({ ...agent, skillsPath: expandPath(agent.skillsPath) }));
}
