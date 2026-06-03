import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { isReservedSkillEntry } from "@/src/lib/skills/is-reserved-skill-entry";
import { readSkillFrontmatter } from "@/src/lib/skills/read-skill-frontmatter";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

type SkillCandidate = {
  agentId: string;
  skillPath: string;
  skillFilePath: string;
  mtime: number;
};

async function scanAgentSkillNames(agent: AgentDefinition): Promise<string[]> {
  try {
    const entries = await readdir(agent.skillsPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !isReservedSkillEntry(e.name))
      .map((e) => e.name);
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.warn(
        `[skills-hub] 无法扫描代理 "${agent.id}" 的技能目录 ${agent.skillsPath}：`,
        (error as Error).message
      );
    }
    return [];
  }
}

async function buildCandidate(
  agent: AgentDefinition,
  skillName: string
): Promise<SkillCandidate | null> {
  const skillPath = join(agent.skillsPath, skillName);
  const skillFilePath = join(skillPath, "SKILL.md");
  try {
    const fileStat = await stat(skillFilePath);
    return { agentId: agent.id, skillPath, skillFilePath, mtime: fileStat.mtimeMs };
  } catch {
    return null;
  }
}

export async function scanAllSkills(agents: AgentDefinition[]): Promise<SkillRecord[]> {
  // 1. 从所有 agent 目录收集 skill 名称的并集
  const namesByAgent = await Promise.all(agents.map(scanAgentSkillNames));
  const allNames = Array.from(new Set(namesByAgent.flat())).sort();

  // 2. 对每个 skill，找出所有 agent 中拥有它的候选，选 mtime 最新的作为 master
  const records = await Promise.all(
    allNames.map(async (skillName): Promise<SkillRecord | null> => {
      const candidates = (
        await Promise.all(agents.map((agent) => buildCandidate(agent, skillName)))
      ).filter((c): c is SkillCandidate => c !== null);

      if (candidates.length === 0) return null;

      // 选 SKILL.md mtime 最新的 agent 作为 master
      const master = candidates.reduce((a, b) => (b.mtime > a.mtime ? b : a));

      try {
        const metadata = await readSkillFrontmatter(master.skillFilePath);
        return {
          name: skillName,
          description: metadata.data.description || "未提供描述。",
          sourcePath: master.skillPath,
          masterAgentId: master.agentId,
          skillFilePath: master.skillFilePath,
          hasSkillMd: true,
          updatedAt: new Date(master.mtime).toISOString(),
          isCustom: false
        } satisfies SkillRecord;
      } catch {
        console.warn(`[skills-hub] 跳过技能目录 "${skillName}"：缺少有效的 SKILL.md`);
        return null;
      }
    })
  );

  return records.filter((r): r is SkillRecord => r !== null);
}
