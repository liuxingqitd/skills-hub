import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { AgentRegistryEntry } from "@/src/types/agents";

const REGISTRY_PATH = path.resolve(process.cwd(), "config/agent-registry.json");
const ENABLED_PATH = path.resolve(process.cwd(), "config/agents.json");

const registryEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skillsPath: z.string().min(1),
  description: z.string(),
  homepage: z.string(),
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
  try {
    const raw = await readFile(ENABLED_PATH, "utf-8");
    const schema = z.object({ enabledIds: z.array(z.string()) });
    return schema.parse(JSON.parse(raw)).enabledIds;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read enabled agent ids:", err);
    }
    return [];
  }
}

export async function writeEnabledAgentIds(ids: string[]): Promise<void> {
  await writeFile(
    ENABLED_PATH,
    JSON.stringify({ enabledIds: ids }, null, 2),
    "utf-8"
  );
}
