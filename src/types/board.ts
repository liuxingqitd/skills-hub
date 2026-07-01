import type { AgentDefinition } from "@/src/types/agents";
import type { InstallStatus, RegistryRow } from "@/src/types/skills";
import type { Category } from "@/src/types/categories";
import type { SkillUsageSummary } from "@/src/types/usage";

export type BoardDisplayStatus = "installed" | "missing" | "broken";

export type SkillBoardCell = {
  agentId: string;
  agentName: string;
  status: InstallStatus;
  displayStatus: BoardDisplayStatus;
  targetPath: string;
  detail: string;
  exists: boolean;
};

export type SkillBoardRow = {
  name: string;
  description: string;
  sourcePath: string;
  skillFilePath: string;
  canSync: boolean;
  missingCount: number;
  categoryIds: string[];
  cells: SkillBoardCell[];
  raw: RegistryRow;
  isCustom: boolean;
  usage: SkillUsageSummary;
};

export type SkillBoardModel = {
  agents: AgentDefinition[];
  rows: SkillBoardRow[];
  categories: Category[];
  pendingSyncCount: number;
};
