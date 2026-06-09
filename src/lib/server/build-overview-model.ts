import { join } from "node:path";

import { loadAgents } from "@/src/lib/config/load-agents";
import { scanAgentStates } from "@/src/lib/skills/scan-agent-skills";
import { scanSourceSkills, SOURCE_SKILLS_DIR } from "@/src/lib/skills/scan-source-skills";
import { bootstrapSourceFromAgents } from "@/src/lib/skills/bootstrap-source";
import { summarizeStates } from "@/src/lib/skills/classify-install-state";
import { buildSyncPlan } from "@/src/lib/sync/build-sync-plan";
import type { AgentDefinition } from "@/src/types/agents";
import type { RegistryRow, SkillInstallState, SkillRecord } from "@/src/types/skills";

let cachedResult: { model: OverviewModel; timestamp: number } | null = null;
const CACHE_TTL_MS = 30_000;

export type OverviewModel = {
  agents: AgentDefinition[];
  skills: SkillRecord[];
  registryRows: RegistryRow[];
  agentStates: Record<string, SkillInstallState[]>;
  allStates: SkillInstallState[];
  stateSummary: ReturnType<typeof summarizeStates>;
  syncPlan: ReturnType<typeof buildSyncPlan>;
};

export async function buildOverviewModel(): Promise<OverviewModel> {
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return cachedResult.model;
  }
  const agents = await loadAgents();

  // 1. 扫描权威数据源 (~/.agents/skills/)
  let skills = await scanSourceSkills();

  // 2. 补齐合集：把其他 agent 目录中独有的 skill 收集到 source
  const bootstrapped = await bootstrapSourceFromAgents(agents, skills);
  if (bootstrapped) {
    skills = await scanSourceSkills();
  }

  // 3. 规范化：所有 skill 的 sourcePath 统一指向权威数据源
  skills = skills.map((skill) => ({
    ...skill,
    sourcePath: join(SOURCE_SKILLS_DIR, skill.name),
  }));

  const entries = await Promise.all(
    agents.map(async (agent) => [agent.id, await scanAgentStates(agent, skills)] as const)
  );
  const agentStates = Object.fromEntries(entries);
  const allStates = Object.values(agentStates).flat();
  const stateSummary = summarizeStates(allStates);
  const syncPlan = buildSyncPlan(allStates);

  const makeMissingState = (
    agent: AgentDefinition,
    skillName: string,
    sourcePath: string | null
  ): SkillInstallState => ({
    skillName,
    agentId: agent.id,
    agentName: agent.name,
    status: "missing",
    sourcePath,
    targetPath: join(agent.skillsPath, skillName),
    exists: false,
    isManaged: false,
    detail: "目标目录中尚未安装。"
  });

  const registryRows: RegistryRow[] = skills
    .map((skill) => ({
      ...skill,
      states: agents.map((agent) => {
        const state = agentStates[agent.id].find(
          (item) => item.skillName === skill.name && item.status !== "orphaned"
        );
        return state ?? makeMissingState(agent, skill.name, skill.sourcePath);
      })
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const result: OverviewModel = {
    agents,
    skills,
    registryRows,
    agentStates,
    allStates,
    stateSummary,
    syncPlan
  };
  cachedResult = { model: result, timestamp: Date.now() };
  return result;
}
