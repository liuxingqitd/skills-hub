export type InstructionAgent = "claude" | "codex" | "hermes";

export type InstructionKind = "main" | "rule" | "override" | "nested";

export type InstructionScope = "user" | "directory";

export type InstructionStatus = "found" | "missing";

export type InstructionAsset = {
  id: string;
  agent: InstructionAgent;
  kind: InstructionKind;
  scope: InstructionScope;
  status: InstructionStatus;
  path: string;
  exists: boolean;
  title: string;
  description: string;
  loadBehavior: string;
  priority: number;
  parentPath: string | null;
  contentPreview: string | null;
  contentHash: string | null;
  isEditable: boolean;
  canCreate: boolean;
};

export type InstructionSummary = {
  mainFiles: number;
  ruleFiles: number;
  nestedFiles: number;
  recommendedMissingFiles: number;
};

export type InstructionSurface = {
  agent: InstructionAgent;
  rootPath: string;
  assets: InstructionAsset[];
  summary: InstructionSummary;
};

export type InstructionsPageModel = {
  surfaces: InstructionSurface[];
  assets: InstructionAsset[];
};
