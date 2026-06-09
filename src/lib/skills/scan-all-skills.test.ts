import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { scanAllSkills } from "@/src/lib/skills/scan-all-skills";
import type { AgentDefinition } from "@/src/types/agents";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, dirName: string, frontmatterName: string) {
  const skillDir = join(root, dirName);
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, "SKILL.md"),
    `---\nname: ${frontmatterName}\ndescription: ${dirName} skill\n---\n`
  );
}

function makeAgent(skillsPath: string): AgentDefinition {
  return {
    id: "codex",
    name: "Codex",
    skillsPath,
    description: "",
    homepage: "",
    enabled: true
  };
}

describe("scanAllSkills", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("uses directory names as stable skill identities even when frontmatter names collide", async () => {
    const root = await makeTempRoot("scan-all-skills-");
    await makeSkill(root, "impeccable", "impeccable");
    await makeSkill(root, "impeccable-extra", "impeccable");

    const skills = await scanAllSkills([makeAgent(root)]);

    expect(skills.map((skill) => skill.name)).toEqual(["impeccable", "impeccable-extra"]);
  });
});
