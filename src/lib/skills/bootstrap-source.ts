import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { isReservedSkillEntry } from "@/src/lib/skills/is-reserved-skill-entry";
import { scanAllSkills } from "@/src/lib/skills/scan-all-skills";
import { SOURCE_SKILLS_DIR } from "@/src/lib/skills/scan-source-skills";
import { deploySkill } from "@/src/lib/sync/link-skill";
import type { SyncMode } from "@/src/lib/config/settings-store";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

async function collectAgentSkillNames(agent: AgentDefinition): Promise<string[]> {
  try {
    const entries = await readdir(agent.skillsPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !isReservedSkillEntry(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function bootstrapSourceFromAgents(
  agents: AgentDefinition[],
  existingSourceSkills: SkillRecord[],
  sourceDir: string = SOURCE_SKILLS_DIR,
  syncMode: SyncMode = "copy"
): Promise<boolean> {
  const allNameSets = await Promise.all(agents.map(collectAgentSkillNames));
  const allAgentNames = new Set(allNameSets.flat());
  if (allAgentNames.size === 0) return false;

  const sourceNames = new Set(existingSourceSkills.map((s) => s.name));
  const missingNames = [...allAgentNames].filter((n) => !sourceNames.has(n));
  if (missingNames.length === 0) return false;

  const agentSkills = await scanAllSkills(agents);
  const missingSkills = agentSkills.filter((s) => missingNames.includes(s.name));

  await mkdir(sourceDir, { recursive: true });

  for (const skill of missingSkills) {
    const targetPath = join(sourceDir, skill.name);
    try {
      await stat(targetPath);
      continue;
    } catch {
      // 不存在
    }
    await deploySkill(skill.sourcePath, targetPath, syncMode);
  }

  return true;
}
