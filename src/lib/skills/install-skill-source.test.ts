import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  classifySkillInstallSource,
  discoverInstallableSkills,
  installSkillSource
} from "@/src/lib/skills/install-skill-source";
import type { AgentDefinition } from "@/src/types/agents";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, name: string, content = "# skill\n") {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
  return skillDir;
}

function makeAgent(id: string, skillsPath: string): AgentDefinition {
  return {
    id,
    name: id.toUpperCase(),
    skillsPath,
    description: "",
    homepage: "",
    enabled: true
  };
}

describe("install skill source", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
    );
  });

  it("classifies GitHub URLs as git sources", () => {
    expect(classifySkillInstallSource("https://github.com/acme/demo-skill")).toBe("git");
    expect(classifySkillInstallSource("https://github.com/acme/demo-skill.git")).toBe("git");
    expect(classifySkillInstallSource("git@github.com:acme/demo-skill.git")).toBe("git");
    expect(classifySkillInstallSource("/tmp/demo-skill")).toBe("local");
  });

  it("classifies GitHub tree URLs as git sources", () => {
    expect(
      classifySkillInstallSource("https://github.com/mvanhorn/last30days-skill/tree/main/skills/last30days")
    ).toBe("git");
    expect(
      classifySkillInstallSource("https://github.com/acme/demo-skill/tree/dev/sub/path")
    ).toBe("git");
    expect(
      classifySkillInstallSource("https://github.com/acme/demo-skill/tree/main")
    ).toBe("git");
  });

  it("discovers a root skill directory", async () => {
    const source = await makeTempRoot("skills-hub-source-");
    await writeFile(join(source, "SKILL.md"), "# root skill\n");

    const skills = await discoverInstallableSkills(source);

    expect(skills).toEqual([
      {
        name: source.split("/").at(-1),
        sourcePath: source,
        skillFilePath: join(source, "SKILL.md")
      }
    ]);
  });

  it("installs a local root skill into every agent", async () => {
    const source = await makeTempRoot("skills-hub-root-skill-");
    const agentA = await makeTempRoot("skills-hub-agent-a-");
    const agentB = await makeTempRoot("skills-hub-agent-b-");
    const sourceDir = await makeTempRoot("skills-hub-source-dir-");
    await writeFile(join(source, "SKILL.md"), "# root skill\n");

    const result = await installSkillSource(source, [
      makeAgent("codex", agentA),
      makeAgent("claude", agentB)
    ], sourceDir);

    const skillName = source.split("/").at(-1);
    expect(result.completed).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    await expect(readFile(join(agentA, skillName!, "SKILL.md"), "utf8")).resolves.toBe(
      "# root skill\n"
    );
    await expect(readFile(join(agentB, skillName!, "SKILL.md"), "utf8")).resolves.toBe(
      "# root skill\n"
    );
  });

  it("installs multiple child skills from one local directory", async () => {
    const source = await makeTempRoot("skills-hub-multi-source-");
    const agentRoot = await makeTempRoot("skills-hub-agent-");
    const sourceDir = await makeTempRoot("skills-hub-source-dir-");
    await makeSkill(source, "alpha", "# alpha\n");
    await makeSkill(source, "beta", "# beta\n");
    await mkdir(join(source, "not-a-skill"));

    const result = await installSkillSource(source, [makeAgent("codex", agentRoot)], sourceDir);

    expect(result.discovered.map((skill) => skill.name).sort()).toEqual(["alpha", "beta"]);
    expect(result.completed).toHaveLength(2);
    await expect(readFile(join(agentRoot, "alpha", "SKILL.md"), "utf8")).resolves.toBe(
      "# alpha\n"
    );
    await expect(readFile(join(agentRoot, "beta", "SKILL.md"), "utf8")).resolves.toBe(
      "# beta\n"
    );
  });

  it("skips existing target directories without overwriting them", async () => {
    const source = await makeTempRoot("skills-hub-conflict-source-");
    const agentRoot = await makeTempRoot("skills-hub-conflict-agent-");
    const sourceDir = await makeTempRoot("skills-hub-source-dir-");
    await makeSkill(source, "alpha", "# incoming\n");
    await makeSkill(agentRoot, "alpha", "# existing\n");

    const result = await installSkillSource(source, [makeAgent("codex", agentRoot)], sourceDir);

    expect(result.completed).toHaveLength(0);
    expect(result.skipped).toEqual([
      expect.objectContaining({
        skillName: "alpha",
        reason: "目标目录已存在，未覆盖。"
      })
    ]);
    await expect(readFile(join(agentRoot, "alpha", "SKILL.md"), "utf8")).resolves.toBe(
      "# existing\n"
    );
  });

  it("rejects directories without installable skills", async () => {
    const source = await makeTempRoot("skills-hub-empty-source-");
    const agentRoot = await makeTempRoot("skills-hub-empty-agent-");
    const sourceDir = await makeTempRoot("skills-hub-source-dir-");

    await expect(installSkillSource(source, [makeAgent("codex", agentRoot)], sourceDir)).rejects.toThrow(
      "没有找到包含 SKILL.md 的 skill 目录。"
    );
  });
});
