import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

const enabledAgent: AgentDefinition = {
  id: "claude",
  name: "Claude",
  skillsPath: "/tmp/claude-skills",
  description: "",
  homepage: "",
  enabled: true,
};

const disabledRegistryAgent: AgentDefinition = {
  id: "cursor",
  name: "Cursor",
  skillsPath: "/tmp/cursor-skills",
  description: "",
  homepage: "",
  enabled: false,
};

const sourceSkill: SkillRecord = {
  name: "cursor-only",
  description: "Cursor only skill",
  sourcePath: "/tmp/source/cursor-only",
  masterAgentId: "source",
  skillFilePath: "/tmp/source/cursor-only/SKILL.md",
  hasSkillMd: true,
  updatedAt: new Date(0).toISOString(),
  isCustom: false,
};

const mocks = vi.hoisted(() => ({
  loadAgents: vi.fn(),
  scanSourceSkills: vi.fn(),
  scanAllSkills: vi.fn(),
  scanAgentStates: vi.fn(),
}));

vi.mock("@/src/lib/config/load-agents", () => ({
  loadAgents: mocks.loadAgents,
}));

vi.mock("@/src/lib/skills/scan-source-skills", () => ({
  SOURCE_SKILLS_DIR: "/tmp/source",
  scanSourceSkills: mocks.scanSourceSkills,
}));

vi.mock("@/src/lib/skills/scan-all-skills", () => ({
  scanAllSkills: mocks.scanAllSkills,
}));

vi.mock("@/src/lib/skills/scan-agent-skills", () => ({
  scanAgentStates: mocks.scanAgentStates,
}));

describe("buildOverviewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadAgents.mockResolvedValue([enabledAgent]);
    mocks.scanSourceSkills.mockResolvedValue([]);
    mocks.scanAllSkills.mockResolvedValue([sourceSkill]);
    mocks.scanAgentStates.mockResolvedValue([]);
  });

  it("builds the startup inventory without bootstrapping discovered skills into source", async () => {
    vi.resetModules();
    const { buildOverviewModel } = await import("@/src/lib/server/build-overview-model");

    const model = await buildOverviewModel();

    expect(mocks.scanSourceSkills).toHaveBeenCalledTimes(1);
    expect(mocks.scanAllSkills).toHaveBeenCalledWith([enabledAgent]);
    expect(model.agents).toEqual([enabledAgent]);
    expect(model.registryRows.map((row) => row.name)).toEqual(["cursor-only"]);
  });
});
