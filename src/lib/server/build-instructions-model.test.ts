import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentDefinition } from "@/src/types/agents";

const mocks = vi.hoisted(() => ({
  readSettings: vi.fn(),
  loadAgents: vi.fn(),
}));

vi.mock("@/src/lib/config/settings-store", () => ({
  readSettings: mocks.readSettings,
}));

vi.mock("@/src/lib/config/load-agents", () => ({
  loadAgents: mocks.loadAgents,
}));

const tempDirs: string[] = [];

const openClawAgent: AgentDefinition = {
  id: "openclaw",
  name: "OpenClaw",
  skillsPath: "/tmp/openclaw/skills",
  description: "",
  homepage: "",
  enabled: true,
};

async function makeTempRoot() {
  const root = await mkdtemp(join(tmpdir(), "instructions-model-"));
  tempDirs.push(root);
  return root;
}

describe("buildInstructionsModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadAgents.mockResolvedValue([openClawAgent]);
    mocks.readSettings.mockResolvedValue({ syncMode: "copy", instructionPaths: {} });
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) =>
        import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }))
      )
    );
  });

  it("adds a placeholder global rule asset for enabled custom agents without a configured path", async () => {
    vi.resetModules();
    const { buildInstructionsModel } = await import("@/src/lib/server/build-instructions-model");

    const model = await buildInstructionsModel("/missing/.claude", "/missing/.codex");

    const asset = model.assets.find((item) => item.agent === "openclaw");
    expect(asset).toMatchObject({
      id: "openclaw:configured",
      title: "OpenClaw 全局规则",
      path: "",
      exists: false,
      isEditable: false,
    });
  });

  it("loads a configured custom agent global rule file", async () => {
    const root = await makeTempRoot();
    const instructionPath = join(root, "OpenClaw.md");
    await mkdir(root, { recursive: true });
    await writeFile(instructionPath, "# OpenClaw\n", "utf8");
    mocks.readSettings.mockResolvedValue({
      syncMode: "copy",
      instructionPaths: { openclaw: instructionPath },
    });
    vi.resetModules();
    const { buildInstructionsModel } = await import("@/src/lib/server/build-instructions-model");

    const model = await buildInstructionsModel("/missing/.claude", "/missing/.codex");

    const asset = model.assets.find((item) => item.agent === "openclaw");
    expect(asset).toMatchObject({
      path: instructionPath,
      exists: true,
      isEditable: true,
      contentPreview: "# OpenClaw\n",
    });
  });
});
