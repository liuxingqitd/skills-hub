import { join } from "node:path";

import {
  buildOrphanedState,
  classifyInstallState
} from "@/src/lib/skills/classify-install-state";
import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";
import { isReservedSkillEntry } from "@/src/lib/skills/is-reserved-skill-entry";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillInstallState, SkillRecord } from "@/src/types/skills";

export async function scanAgentStates(
  agent: AgentDefinition,
  skills: SkillRecord[]
): Promise<SkillInstallState[]> {
  const discovered = await discoverSkillDirs(agent.skillsPath);
  const discoveredByName = new Map<string, string>();
  for (const skill of discovered) {
    if (!discoveredByName.has(skill.name)) {
      discoveredByName.set(skill.name, skill.sourcePath);
    }
  }

  const states = await Promise.all(
    skills.map((skill) => {
      const discoveredPath = discoveredByName.get(skill.name);
      return classifyInstallState(
        skill,
        agent,
        discoveredPath ?? join(agent.skillsPath, skill.name)
      );
    })
  );

  const existingSkillNames = new Set(skills.map((skill) => skill.name));

  for (const skill of discovered) {
    if (isReservedSkillEntry(skill.name)) {
      continue;
    }

    if (existingSkillNames.has(skill.name)) {
      continue;
    }

    states.push(buildOrphanedState(skill.name, agent, skill.sourcePath));
  }

  return states.sort((left, right) => left.skillName.localeCompare(right.skillName));
}
