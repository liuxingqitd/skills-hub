import type { SkillUsageEvent, SkillUsageSummary } from "@/src/types/usage";

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptySkillUsageSummary(skillName: string): SkillUsageSummary {
  return {
    skillName,
    totalCount: 0,
    count7d: 0,
    count30d: 0,
    lastUsedAt: null,
    byAgent: {},
  };
}

export function buildSkillUsageSummaries(
  events: SkillUsageEvent[],
  now = new Date()
): Map<string, SkillUsageSummary> {
  const summaries = new Map<string, SkillUsageSummary>();
  const nowMs = now.getTime();
  const since7d = nowMs - 7 * DAY_MS;
  const since30d = nowMs - 30 * DAY_MS;

  for (const event of events) {
    const occurredMs = Date.parse(event.occurredAt);
    if (!Number.isFinite(occurredMs)) continue;

    const summary =
      summaries.get(event.skillName) ?? emptySkillUsageSummary(event.skillName);

    summary.totalCount += 1;
    if (occurredMs >= since7d && occurredMs <= nowMs) summary.count7d += 1;
    if (occurredMs >= since30d && occurredMs <= nowMs) summary.count30d += 1;
    summary.byAgent[event.agentId] = (summary.byAgent[event.agentId] ?? 0) + 1;

    if (!summary.lastUsedAt || occurredMs > Date.parse(summary.lastUsedAt)) {
      summary.lastUsedAt = event.occurredAt;
    }

    summaries.set(event.skillName, summary);
  }

  return summaries;
}
