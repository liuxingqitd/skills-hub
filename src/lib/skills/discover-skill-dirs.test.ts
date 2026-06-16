import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";

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
}

describe("discoverSkillDirs", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("finds only direct skill directories", async () => {
    const root = await makeTempRoot("discover-skill-dirs-");
    await makeSkill(root, "direct");
    await makeSkill(root, "plugins/cache/vendor/package/1.0.0/skills/nested");

    const skills = await discoverSkillDirs(root);

    expect(skills.map((skill) => skill.name)).toEqual(["direct"]);
  });

  it("skips hidden and reserved directories", async () => {
    const root = await makeTempRoot("discover-skill-dirs-reserved-");
    await makeSkill(root, ".system/system-skill");
    await makeSkill(root, ".tmp/temp-skill");
    await makeSkill(root, "visible");

    const skills = await discoverSkillDirs(root);

    expect(skills.map((skill) => skill.name)).toEqual(["visible"]);
  });
});
