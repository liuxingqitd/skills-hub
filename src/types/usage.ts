export type SkillUsageSource =
  | "codex-log"
  | "claude-log"
  | "cursor-log"
  | "manual"
  | "hook";

export type SkillUsageConfidence = "exact" | "inferred";

export type SkillUsageEvent = {
  id: string;
  skillName: string;
  agentId: string;
  occurredAt: string;
  source: SkillUsageSource;
  confidence: SkillUsageConfidence;
  workspacePath?: string;
  conversationId?: string;
};

export type SkillUsageSummary = {
  skillName: string;
  totalCount: number;
  count7d: number;
  count30d: number;
  lastUsedAt: string | null;
  byAgent: Record<string, number>;
};
