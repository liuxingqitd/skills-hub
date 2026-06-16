import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applySyncPlan } from "@/src/lib/sync/apply-sync-plan";
import type { SyncPlan } from "@/src/types/sync";

const tempDirs: string[] = [];

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, name: string, content: string) {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
  return skillDir;
}

describe("applySyncPlan", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("materializes inventory sources into the canonical source root before syncing", async () => {
    const inventoryRoot = await makeTempRoot("apply-inventory-");
    const canonicalRoot = await makeTempRoot("apply-canonical-");
    const targetRoot = await makeTempRoot("apply-target-");
    const inventorySkill = await makeSkill(inventoryRoot, "azure-diagnostics", "# azure\n");

    const plan: SyncPlan = {
      actions: [
        {
          type: "create_copy",
          skillName: "azure-diagnostics",
          agentId: "codex",
          agentName: "Codex",
          sourcePath: inventorySkill,
          targetPath: join(targetRoot, "azure-diagnostics"),
          reason: "missing",
        },
      ],
      summary: {
        create_copy: 1,
        repair_copy: 0,
        skip_conflict: 0,
        remove_orphan: 0,
      },
    };

    const result = await applySyncPlan(plan, {
      syncMode: "copy",
      allowedSourceRoots: [canonicalRoot],
      canonicalSourceRoot: canonicalRoot,
    });

    expect(result.failed).toEqual([]);
    await expect(readFile(join(canonicalRoot, "azure-diagnostics", "SKILL.md"), "utf8")).resolves.toBe(
      "# azure\n"
    );
    await expect(readFile(join(targetRoot, "azure-diagnostics", "SKILL.md"), "utf8")).resolves.toBe(
      "# azure\n"
    );
  });
});
