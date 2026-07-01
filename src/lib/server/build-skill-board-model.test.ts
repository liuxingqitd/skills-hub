import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentDefinition } from "@/src/types/agents";
import type { Category } from "@/src/types/categories";
import type { RegistryRow } from "@/src/types/skills";

const agent: AgentDefinition = {
  id: "codex",
  name: "Codex",
  skillsPath: "/tmp/codex-skills",
  description: "",
  homepage: "",
  enabled: true,
};

const category: Category = {
  id: "video",
  name: "视频",
  icon: "Video",
  desc: "视频相关技能",
  color: "#ef4444",
  order: 1,
  isPreset: true,
  keywords: ["video", "transcript"],
};

const videoSkill: RegistryRow = {
  name: "video-transcript",
  description: "Create video transcript summaries",
  sourcePath: "/tmp/source/video-transcript",
  masterAgentId: "source",
  skillFilePath: "/tmp/source/video-transcript/SKILL.md",
  hasSkillMd: true,
  updatedAt: new Date(0).toISOString(),
  isCustom: false,
  states: [
    {
      skillName: "video-transcript",
      agentId: agent.id,
      agentName: agent.name,
      status: "synced",
      sourcePath: "/tmp/source/video-transcript",
      targetPath: "/tmp/codex-skills/video-transcript",
      exists: true,
      isManaged: true,
      detail: "",
    },
  ],
};

const mocks = vi.hoisted(() => ({
  buildOverviewModel: vi.fn(),
  readCustomSkills: vi.fn(),
  readCategories: vi.fn(),
  readSkillCategories: vi.fn(),
  readSkillUsageEvents: vi.fn(),
}));

vi.mock("@/src/lib/server/build-overview-model", () => ({
  buildOverviewModel: mocks.buildOverviewModel,
}));

vi.mock("@/src/lib/config/custom-skills-store", () => ({
  readCustomSkills: mocks.readCustomSkills,
}));

vi.mock("@/src/lib/config/categories-store", () => ({
  readCategories: mocks.readCategories,
}));

vi.mock("@/src/lib/config/skill-categories-store", () => ({
  readSkillCategories: mocks.readSkillCategories,
}));

vi.mock("@/src/lib/usage/usage-store", () => ({
  readSkillUsageEvents: mocks.readSkillUsageEvents,
}));

describe("buildSkillBoardModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildOverviewModel.mockResolvedValue({
      agents: [agent],
      registryRows: [videoSkill],
      pendingSyncCount: 0,
    });
    mocks.readCustomSkills.mockResolvedValue([]);
    mocks.readCategories.mockResolvedValue([category]);
    mocks.readSkillCategories.mockResolvedValue({});
    mocks.readSkillUsageEvents.mockResolvedValue([]);
  });

  it("does not auto-assign categories when a skill matches category keywords", async () => {
    vi.resetModules();
    const { buildSkillBoardModel } = await import("@/src/lib/server/build-skill-board-model");

    const model = await buildSkillBoardModel();

    expect(model.rows[0]?.categoryIds).toEqual([]);
  });

  it("keeps explicitly configured skill categories", async () => {
    mocks.readSkillCategories.mockResolvedValue({ "video-transcript": ["video"] });
    vi.resetModules();
    const { buildSkillBoardModel } = await import("@/src/lib/server/build-skill-board-model");

    const model = await buildSkillBoardModel();

    expect(model.rows[0]?.categoryIds).toEqual(["video"]);
  });

  it("attaches usage summaries to skill rows", async () => {
    mocks.readSkillUsageEvents.mockResolvedValue([
      {
        id: "event-1",
        skillName: "video-transcript",
        agentId: "codex",
        occurredAt: new Date().toISOString(),
        source: "manual",
        confidence: "exact",
      },
    ]);
    vi.resetModules();
    const { buildSkillBoardModel } = await import("@/src/lib/server/build-skill-board-model");

    const model = await buildSkillBoardModel();

    expect(model.rows[0]?.usage).toMatchObject({
      skillName: "video-transcript",
      totalCount: 1,
      count30d: 1,
      byAgent: {
        codex: 1,
      },
    });
  });
});
