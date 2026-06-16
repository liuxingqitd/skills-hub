import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { isReservedSkillEntry } from "@/src/lib/skills/is-reserved-skill-entry";

export type DiscoveredSkillDir = {
  name: string;
  sourcePath: string;
  skillFilePath: string;
  mtime: number;
};

const SKIP_DIR_NAMES = new Set(["node_modules", ".git", ".next"]);

function shouldSkipDir(name: string): boolean {
  return isReservedSkillEntry(name) || SKIP_DIR_NAMES.has(name);
}

export async function discoverSkillDirs(root: string): Promise<DiscoveredSkillDir[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "ENOTDIR" && code !== "EACCES") {
      console.warn(`[skills-hub] 无法扫描技能目录 ${root}：`, (error as Error).message);
    }
    return [];
  }

  const found = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !shouldSkipDir(entry.name))
      .map(async (entry): Promise<DiscoveredSkillDir | null> => {
        const sourcePath = join(root, entry.name);
        const skillFilePath = join(sourcePath, "SKILL.md");
        try {
          const fileStat = await stat(skillFilePath);
          return {
            name: entry.name,
            sourcePath,
            skillFilePath,
            mtime: fileStat.mtimeMs,
          };
        } catch {
          return null;
        }
      })
  );

  return found
    .filter((skill): skill is DiscoveredSkillDir => skill !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}
