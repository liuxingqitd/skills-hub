import { buildOverviewModel } from "@/src/lib/server/build-overview-model";
import { readCustomSkills } from "@/src/lib/config/custom-skills-store";
import { readCategories } from "@/src/lib/config/categories-store";
import { readSkillCategories } from "@/src/lib/config/skill-categories-store";
import { readSkillUsageEvents } from "@/src/lib/usage/usage-store";
import { buildSkillUsageSummaries, emptySkillUsageSummary } from "@/src/lib/usage/usage-summary";
import type { SkillBoardCell, SkillBoardModel, SkillBoardRow } from "@/src/types/board";
import type { InstallStatus } from "@/src/types/skills";

const DISPLAY_STATUS: Record<InstallStatus, SkillBoardCell["displayStatus"]> = {
  synced: "installed",
  missing: "missing",
  drifted: "broken",
  conflict: "broken",
  orphaned: "installed"
};

export async function buildSkillBoardModel(): Promise<SkillBoardModel> {
  const [overview, customNames, categories, skillCatMap, usageEvents] = await Promise.all([
    buildOverviewModel(),
    readCustomSkills(),
    readCategories(),
    readSkillCategories(),
    readSkillUsageEvents(),
  ]);
  const customSet = new Set(customNames);
  const usageBySkill = buildSkillUsageSummaries(usageEvents);
  const rows: SkillBoardRow[] = overview.registryRows.map((row) => {
      const cells = row.states.map((state) => ({
        agentId: state.agentId,
        agentName: state.agentName,
        status: state.status,
        displayStatus: DISPLAY_STATUS[state.status],
        targetPath: state.targetPath,
        detail: state.detail,
        exists: state.exists
      }));
      const missingCount = row.states.filter(
        (state) => (state.status === "missing" || state.status === "drifted") && Boolean(state.sourcePath)
      ).length;

      const categoryIds = row.name in skillCatMap
        ? skillCatMap[row.name]
        : [];

      return {
        name: row.name,
        description: row.description,
        sourcePath: row.sourcePath || row.states.find((state) => state.sourcePath)?.sourcePath || "",
        skillFilePath: row.skillFilePath,
        canSync: missingCount > 0,
        missingCount,
        categoryIds,
        cells,
        raw: row,
        isCustom: customSet.has(row.name),
        usage: usageBySkill.get(row.name) ?? emptySkillUsageSummary(row.name)
      };
  });

  return {
    agents: overview.agents,
    rows,
    categories,
    pendingSyncCount: rows.reduce((sum, row) => sum + row.missingCount, 0)
  };
}
