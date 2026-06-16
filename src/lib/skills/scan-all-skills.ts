import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";
import { readSkillFrontmatter } from "@/src/lib/skills/read-skill-frontmatter";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

// 此函数仅用于 bootstrap 阶段：扫描所有 agent 目录中的 skill，
// 选出每个 skill 在各 agent 中 SKILL.md mtime 最新的副本，
// 以便将其回填到权威数据源 (~/.agents/skills/) 中。
// 正常同步流程不再使用此函数。

type SkillCandidate = {
  agentId: string;
  skillPath: string;
  skillFilePath: string;
  mtime: number;
};

export async function scanAllSkills(agents: AgentDefinition[]): Promise<SkillRecord[]> {
  const candidatesByName = new Map<string, SkillCandidate[]>();

  await Promise.all(
    agents.map(async (agent) => {
      const discovered = await discoverSkillDirs(agent.skillsPath);
      for (const skill of discovered) {
        const candidates = candidatesByName.get(skill.name) ?? [];
        candidates.push({
          agentId: agent.id,
          skillPath: skill.sourcePath,
          skillFilePath: skill.skillFilePath,
          mtime: skill.mtime,
        });
        candidatesByName.set(skill.name, candidates);
      }
    })
  );

  // 2. 对每个 skill，找出所有 agent 中拥有它的候选，选 mtime 最新的作为 master
  const records = await Promise.all(
    Array.from(candidatesByName.entries()).map(async ([skillName, candidates]): Promise<SkillRecord | null> => {
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
