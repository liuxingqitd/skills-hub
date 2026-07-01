import { describe, expect, it } from "vitest";

import { buildSkillUsageSummaries, emptySkillUsageSummary } from "./usage-summary";
import type { SkillUsageEvent } from "@/src/types/usage";

describe("buildSkillUsageSummaries", () => {
  it("aggregates total, recent windows, last used time, and agent counts", () => {
    const events: SkillUsageEvent[] = [
      event("1", "imagegen", "codex", "2026-06-25T08:00:00.000Z"),
      event("2", "imagegen", "claude", "2026-06-20T08:00:00.000Z"),
      event("3", "imagegen", "codex", "2026-05-20T08:00:00.000Z"),
      event("4", "browser", "codex", "2026-06-01T08:00:00.000Z"),
    ];

    const summaries = buildSkillUsageSummaries(
      events,
      new Date("2026-06-26T08:00:00.000Z")
    );

    expect(summaries.get("imagegen")).toEqual({
      skillName: "imagegen",
      totalCount: 3,
      count7d: 2,
      count30d: 2,
      lastUsedAt: "2026-06-25T08:00:00.000Z",
      byAgent: {
        codex: 2,
        claude: 1,
      },
    });
    expect(summaries.get("browser")?.count30d).toBe(1);
  });

  it("creates an empty summary for skills without events", () => {
    expect(emptySkillUsageSummary("unused")).toEqual({
      skillName: "unused",
      totalCount: 0,
      count7d: 0,
      count30d: 0,
      lastUsedAt: null,
      byAgent: {},
    });
  });
});

function event(
  id: string,
  skillName: string,
  agentId: string,
  occurredAt: string
): SkillUsageEvent {
  return {
    id,
    skillName,
    agentId,
    occurredAt,
    source: "manual",
    confidence: "exact",
  };
}
