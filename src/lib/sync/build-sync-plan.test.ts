import { describe, expect, it } from "vitest";

import { buildSyncPlan } from "@/src/lib/sync/build-sync-plan";
import type { SkillInstallState } from "@/src/types/skills";

describe("buildSyncPlan", () => {
  it("creates actions for non-synced states", () => {
    const states: SkillInstallState[] = [
      {
        skillName: "frontend-design",
        agentId: "codex",
        agentName: "Codex",
        status: "missing",
        sourcePath: "/source/frontend-design",
        targetPath: "/target/frontend-design",
        exists: false,
        isManaged: false,
        detail: "missing"
      },
      {
        skillName: "copywriting",
        agentId: "cursor",
        agentName: "Cursor",
        status: "drifted",
        sourcePath: "/source/copywriting",
        targetPath: "/target/copywriting",
        exists: true,
        isManaged: false,
        detail: "drifted"
      }
    ];

    const plan = buildSyncPlan(states);

    expect(plan.summary.create_copy).toBe(1);
    expect(plan.summary.repair_copy).toBe(1);
    expect(plan.actions).toHaveLength(2);
  });
});
