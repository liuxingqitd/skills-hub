import { rm, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";
import { SOURCE_SKILLS_DIR } from "@/src/lib/skills/scan-source-skills";
import type { AgentDefinition } from "@/src/types/agents";

type RemoveSkillInstancesOptions = {
  sourceDir?: string;
};

export type RemoveSkillInstancesResult = {
  removedPaths: string[];
};

function isWithinRoot(targetPath: string, rootPath: string): boolean {
  const target = resolve(targetPath);
  const root = resolve(rootPath);
  return target === root || target.startsWith(root + sep);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function removeSkillInstances(
  skillName: string,
  agents: AgentDefinition[],
  options: RemoveSkillInstancesOptions = {}
): Promise<RemoveSkillInstancesResult> {
  const sourceDir = options.sourceDir ?? SOURCE_SKILLS_DIR;
  const roots = new Set<string>([sourceDir]);

  for (const agent of agents) {
    roots.add(agent.skillsPath);
  }

  const pathsToRemove = new Set<string>();
  const directSourcePath = join(sourceDir, skillName);
  if (await pathExists(directSourcePath)) {
    pathsToRemove.add(resolve(directSourcePath));
  }

  await Promise.all(
    [...roots].map(async (root) => {
      const skills = await discoverSkillDirs(root);
      for (const skill of skills) {
        if (skill.name !== skillName) {
          continue;
        }
        if (!isWithinRoot(skill.sourcePath, root)) {
          throw new Error(`Path traversal detected: ${skill.sourcePath}`);
        }
        pathsToRemove.add(resolve(skill.sourcePath));
      }
    })
  );

  const removedPaths = [...pathsToRemove].sort();
  await Promise.all(removedPaths.map((path) => rm(path, { recursive: true, force: true })));

  return { removedPaths };
}
