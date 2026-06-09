import { mkdir, mkdtemp, readFile, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { deploySkill, repairSkill } from "@/src/lib/sync/link-skill";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkillDir(root: string, name: string, content = "# test skill\n") {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
  return skillDir;
}

describe("deploySkill", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("copies directory when mode is copy", async () => {
    const source = await makeTempRoot("link-skill-src-");
    const target = await makeTempRoot("link-skill-tgt-");
    await makeSkillDir(source, "myskill", "# hello\n");

    await deploySkill(join(source, "myskill"), join(target, "myskill"), "copy");

    const content = await readFile(join(target, "myskill", "SKILL.md"), "utf8");
    expect(content).toContain("# hello");
  });

  it("creates symlink when mode is symlink", async () => {
    const source = await makeTempRoot("link-skill-src-");
    const target = await makeTempRoot("link-skill-tgt-");
    await makeSkillDir(source, "myskill", "# symlinked\n");

    await deploySkill(join(source, "myskill"), join(target, "myskill"), "symlink");

    const linkTarget = await readlink(join(target, "myskill"));
    expect(linkTarget).toBe(join(source, "myskill"));

    const content = await readFile(join(target, "myskill", "SKILL.md"), "utf8");
    expect(content).toContain("# symlinked");
  });
});

describe("repairSkill", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("replaces stale symlink with fresh one when mode is symlink", async () => {
    const source = await makeTempRoot("link-skill-src-");
    const target = await makeTempRoot("link-skill-tgt-");
    await makeSkillDir(source, "myskill", "# v2\n");
    await makeSkillDir(target, "myskill", "# v1\n");

    await repairSkill(join(source, "myskill"), join(target, "myskill"), "symlink");

    const linkTarget = await readlink(join(target, "myskill"));
    expect(linkTarget).toBe(join(source, "myskill"));
  });

  it("replaces stale copy with fresh one when mode is copy", async () => {
    const source = await makeTempRoot("link-skill-src-");
    const target = await makeTempRoot("link-skill-tgt-");
    await makeSkillDir(source, "myskill", "# v2\n");
    await makeSkillDir(target, "myskill", "# v1\n");

    await repairSkill(join(source, "myskill"), join(target, "myskill"), "copy");

    const content = await readFile(join(target, "myskill", "SKILL.md"), "utf8");
    expect(content).toContain("# v2");
  });
});
