export type SkillRecord = {
  name: string;
  description: string;
  sourcePath: string;
  masterAgentId: string;
  skillFilePath: string;
  hasSkillMd: boolean;
  updatedAt: string;
  isCustom: boolean;
};

export type InstallStatus =
  | "synced"
  | "missing"
  | "drifted"
  | "conflict"
  | "orphaned";

export type SkillInstallState = {
  skillName: string;
  agentId: string;
  agentName: string;
  status: InstallStatus;
  sourcePath: string | null;
  targetPath: string;
  exists: boolean;
  isManaged: boolean;
  detail: string;
};

export type RegistryRow = SkillRecord & {
  states: SkillInstallState[];
};
