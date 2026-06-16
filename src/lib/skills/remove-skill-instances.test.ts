import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { removeSkillInstances } from "@/src/lib/skills/remove-skill-instances";
import type { AgentDefinition } from "@/src/types/agents";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, relativePath: string) {
  const skillDir = join(root, relativePath);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), "# skill\n");
  return skillDir;
}

function makeAgent(id: string, skillsPath: string): AgentDefinition {
  return {
    id,
    name: id,
    skillsPath,
    description: "",
    homepage: "",
    enabled: true,
  };
}

describe("removeSkillInstances", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("removes matching skill instances from source and agent skills roots only", async () => {
    const sourceRoot = await makeTempRoot("remove-source-");
    const claudeRoot = await makeTempRoot("remove-claude-");
    const pluginRoot = await makeTempRoot("remove-plugin-");

    await makeSkill(sourceRoot, "azure-diagnostics");
    await makeSkill(claudeRoot, "azure-diagnostics");
    await makeSkill(pluginRoot, "vendor/azure/1.0.0/skills/azure-diagnostics");
    await makeSkill(pluginRoot, "vendor/azure/1.0.0/skills/azure-cost");

    const result = await removeSkillInstances(
      "azure-diagnostics",
      [makeAgent("claude", claudeRoot)],
      { sourceDir: sourceRoot }
    );

    expect(result.removedPaths).toHaveLength(2);
    await expect(readdir(join(sourceRoot, "azure-diagnostics"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readdir(join(claudeRoot, "azure-diagnostics"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      readdir(join(pluginRoot, "vendor/azure/1.0.0/skills/azure-diagnostics"))
    ).resolves.toEqual(["SKILL.md"]);
    await expect(readdir(join(pluginRoot, "vendor/azure/1.0.0/skills/azure-cost"))).resolves.toEqual([
      "SKILL.md",
    ]);
  });
});
