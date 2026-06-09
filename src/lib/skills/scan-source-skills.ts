import { homedir } from "node:os";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { isReservedSkillEntry } from "@/src/lib/skills/is-reserved-skill-entry";
import { readSkillFrontmatter } from "@/src/lib/skills/read-skill-frontmatter";
import type { SkillRecord } from "@/src/types/skills";

export const SOURCE_SKILLS_DIR =
  process.env.AGENT_SKILLS_DIR ?? join(homedir(), ".agents", "skills");

export async function scanSourceSkills(
  sourceDir: string = SOURCE_SKILLS_DIR
): Promise<SkillRecord[]> {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const scannedSkills: Array<SkillRecord | null> = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !isReservedSkillEntry(entry.name))
      .map(async (entry) => {
        const sourcePath = join(sourceDir, entry.name);
        const skillFilePath = join(sourcePath, "SKILL.md");

        try {
          const metadata = await readSkillFrontmatter(skillFilePath);
          const fileStat = await stat(skillFilePath);
          return {
            name: entry.name,
            description: metadata.data.description || "未提供描述。",
            sourcePath,
            masterAgentId: "source",
            skillFilePath,
            hasSkillMd: true,
            updatedAt: fileStat.mtime.toISOString(),
            isCustom: false
          } satisfies SkillRecord;
        } catch {
          console.warn(`[skills-hub] 跳过技能目录 "${entry.name}"：缺少有效的 SKILL.md`);
          return null;
        }
      })
  );

  const skills = scannedSkills.filter(
    (skill): skill is SkillRecord => skill !== null
  );

  return skills
    .sort((left, right) => left.name.localeCompare(right.name));
}
