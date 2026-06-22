import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { AgentDefinition, AgentRegistryEntry } from "@/src/types/agents";

const REGISTRY_PATH = path.resolve(process.cwd(), "config/agent-registry.json");
const ENABLED_PATH = path.resolve(process.cwd(), "config/agents.json");

const registryEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skillsPath: z.string().min(1),
  description: z.string(),
  homepage: z.string(),
});

const editableAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skillsPath: z.string().min(1),
  description: z.string().optional().default(""),
  homepage: z.string().optional().default(""),
  enabled: z.boolean().optional().default(true),
  builtin: z.boolean().optional().default(false),
});

const editableConfigSchema = z.object({
  version: z.literal(2),
  agents: z.array(editableAgentSchema),
});

const legacySelectionSchema = z.object({
  enabledIds: z.array(z.string()),
  customized: z.boolean().optional(),
});

export async function readAgentRegistry(): Promise<AgentRegistryEntry[]> {
  try {
    const raw = await readFile(REGISTRY_PATH, "utf-8");
    return z.array(registryEntrySchema).parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read agent registry:", err);
    }
    return [];
  }
}

export async function readEnabledAgentIds(): Promise<string[]> {
  return (await readAgentSelection()).enabledIds;
}

export async function readAgentSelection(): Promise<{
  enabledIds: string[];
  customized: boolean;
}> {
  try {
    const raw = await readFile(ENABLED_PATH, "utf-8");
    const json = JSON.parse(raw);
    const editable = editableConfigSchema.safeParse(json);
    if (editable.success) {
      return {
        enabledIds: editable.data.agents
          .filter((agent) => agent.enabled)
          .map((agent) => agent.id),
        customized: true,
      };
    }

    const parsed = legacySelectionSchema.parse(json);
    return {
      enabledIds: parsed.enabledIds,
      customized: parsed.customized ?? true,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read enabled agent ids:", err);
    }
    return { enabledIds: [], customized: false };
  }
}

export async function readEditableAgentsConfig(): Promise<AgentDefinition[] | null> {
  try {
    const raw = await readFile(ENABLED_PATH, "utf-8");
    const parsed = editableConfigSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return null;
    }
    return parsed.data.agents;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read editable agent config:", err);
    }
    return null;
  }
}

export async function writeAgentsConfig(agents: AgentDefinition[]): Promise<void> {
  const normalized = agents.map((agent) => ({
    id: agent.id.trim(),
    name: agent.name.trim(),
    skillsPath: agent.skillsPath.trim(),
    description: agent.description.trim(),
    homepage: agent.homepage.trim(),
    enabled: agent.enabled,
    builtin: agent.builtin ?? false,
  }));

  await writeFile(
    ENABLED_PATH,
    JSON.stringify({ version: 2, agents: normalized }, null, 2),
    "utf-8"
  );
}

export async function writeEnabledAgentIds(ids: string[]): Promise<void> {
  const existing = await readEditableAgentsConfig();
  if (existing) {
    const enabledIds = new Set(ids);
    await writeAgentsConfig(
      existing.map((agent) => ({ ...agent, enabled: enabledIds.has(agent.id) }))
    );
    return;
  }

  const registry = await readAgentRegistry();
  const enabledIds = new Set(ids);
  await writeAgentsConfig(
    registry.map((agent) => ({
      ...agent,
      enabled: enabledIds.has(agent.id),
      builtin: true,
    }))
  );
}
