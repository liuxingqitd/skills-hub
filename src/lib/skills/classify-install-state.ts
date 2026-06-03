import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import type { AgentDefinition } from "@/src/types/agents";
import type { InstallStatus, SkillInstallState, SkillRecord } from "@/src/types/skills";

async function fileHash(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath);
    return createHash("sha256").update(content).digest("hex");
  } catch {
    return null;
  }
}

async function isCopyUpToDate(sourcePath: string, targetPath: string): Promise<boolean> {
  const sourceSkillMd = join(sourcePath, "SKILL.md");
  const targetSkillMd = join(targetPath, "SKILL.md");
  const [srcHash, dstHash] = await Promise.all([fileHash(sourceSkillMd), fileHash(targetSkillMd)]);
  return srcHash !== null && srcHash === dstHash;
}

export async function classifyInstallState(
  skill: SkillRecord,
  agent: AgentDefinition,
  targetPath: string
): Promise<SkillInstallState> {
  const base: SkillInstallState = {
    skillName: skill.name,
    agentId: agent.id,
    agentName: agent.name,
    status: "missing",
    sourcePath: skill.sourcePath,
    targetPath,
    exists: false,
    isManaged: false,
    detail: "目标目录中尚未安装。"
  };

  let targetStat;
  try {
    targetStat = await stat(targetPath);
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return base;
    }
    base.detail = `读取目标路径时发生错误：${(error as Error).message}`;
    return base;
  }

  base.exists = true;

  if (!targetStat.isDirectory()) {
    base.status = "conflict";
    base.detail = "目标路径存在但不是目录，阻塞了自动同步。";
    return base;
  }

  const upToDate = await isCopyUpToDate(skill.sourcePath, targetPath);

  if (upToDate) {
    base.status = "synced";
    base.isManaged = true;
    base.detail = "目标目录内容与主源一致。";
  } else {
    base.status = "drifted";
    base.detail = "目标目录存在，但内容与主源不一致，需要重新同步。";
  }

  return base;
}

export function buildOrphanedState(
  skillName: string,
  agent: AgentDefinition,
  targetPath: string
): SkillInstallState {
  return {
    skillName,
    agentId: agent.id,
    agentName: agent.name,
    status: "orphaned",
    sourcePath: null,
    targetPath,
    exists: true,
    isManaged: false,
    detail: "目标目录存在，但没有找到对应的主源技能。"
  };
}

export function summarizeStates(states: SkillInstallState[]): Record<InstallStatus, number> {
  return states.reduce(
    (acc, state) => {
      acc[state.status] += 1;
      return acc;
    },
    {
      synced: 0,
      missing: 0,
      drifted: 0,
      conflict: 0,
      orphaned: 0
    } satisfies Record<InstallStatus, number>
  );
}
