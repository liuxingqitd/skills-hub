import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapSourceFromAgents } from "@/src/lib/skills/bootstrap-source";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, dirName: string, content = "# skill\n") {
  const skillDir = join(root, dirName);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
  return skillDir;
}

function makeAgent(id: string, skillsPath: string): AgentDefinition {
  return { id, name: id.toUpperCase(), skillsPath, description: "", homepage: "", enabled: true };
}

describe("bootstrapSourceFromAgents", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("returns false when agents have no skills", async () => {
    const agentRoot = await makeTempRoot("bootstrap-empty-");
    const sourceDir = await makeTempRoot("bootstrap-source-");
    const result = await bootstrapSourceFromAgents([makeAgent("claude", agentRoot)], [], sourceDir);
    expect(result).toBe(false);
  });

  it("returns false when all agent skills are already in source", async () => {
    const agentRoot = await makeTempRoot("bootstrap-synced-");
    const sourceDir = await makeTempRoot("bootstrap-source-");
    await makeSkill(agentRoot, "frontend-design");

    const existingSourceSkills: SkillRecord[] = [
      {
        name: "frontend-design",
        description: "",
        sourcePath: "",
        masterAgentId: "source",
        skillFilePath: "",
        hasSkillMd: true,
        updatedAt: new Date().toISOString(),
        isCustom: false,
      },
    ];

    const result = await bootstrapSourceFromAgents(
      [makeAgent("claude", agentRoot)],
      existingSourceSkills,
      sourceDir
    );
    expect(result).toBe(false);
  });

  it("copies skills from agents into source dir when missing", async () => {
    const agentRoot = await makeTempRoot("bootstrap-agent-");
    const sourceDir = await makeTempRoot("bootstrap-source-");
    await makeSkill(agentRoot, "alpha", "# alpha from agent\n");

    const result = await bootstrapSourceFromAgents([makeAgent("codex", agentRoot)], [], sourceDir);

    expect(result).toBe(true);
    const content = await readFile(join(sourceDir, "alpha", "SKILL.md"), "utf8");
    expect(content).toContain("# alpha from agent");
  });

  it("collects skills from multiple agents into source dir", async () => {
    const agentA = await makeTempRoot("bootstrap-agent-a-");
    const agentB = await makeTempRoot("bootstrap-agent-b-");
    const sourceDir = await makeTempRoot("bootstrap-source-");
    await makeSkill(agentA, "alpha", "# alpha\n");
    await makeSkill(agentB, "beta", "# beta\n");

    const result = await bootstrapSourceFromAgents(
      [makeAgent("claude", agentA), makeAgent("codex", agentB)],
      [],
      sourceDir
    );

    expect(result).toBe(true);
    await expect(readFile(join(sourceDir, "alpha", "SKILL.md"), "utf8")).resolves.toContain("# alpha");
    await expect(readFile(join(sourceDir, "beta", "SKILL.md"), "utf8")).resolves.toContain("# beta");
  });

  it("ignores skills outside the configured agent skills directory", async () => {
    const targetRoot = await makeTempRoot("bootstrap-agent-target-");
    const pluginRoot = await makeTempRoot("bootstrap-agent-plugin-");
    const sourceDir = await makeTempRoot("bootstrap-source-");
    await makeSkill(targetRoot, "direct", "# direct skill\n");
    await makeSkill(pluginRoot, "vendor/package/1.0.0/skills/plugin-only", "# plugin skill\n");

    const agent: AgentDefinition = makeAgent("codex", targetRoot);

    const result = await bootstrapSourceFromAgents([agent], [], sourceDir);

    expect(result).toBe(true);
    await expect(readFile(join(sourceDir, "direct", "SKILL.md"), "utf8")).resolves.toContain(
      "# direct skill"
    );
    await expect(readFile(join(sourceDir, "plugin-only", "SKILL.md"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
