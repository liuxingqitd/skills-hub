import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  appendSkillUsageEvent,
  parseSkillUsageEventLine,
  readSkillUsageEvents,
} from "./usage-store";

describe("usage-store", () => {
  it("returns an empty list when the usage log is missing", async () => {
    await expect(readSkillUsageEvents("/tmp/missing-skill-usage.jsonl")).resolves.toEqual([]);
  });

  it("reads valid JSONL events and skips malformed lines", async () => {
    const root = await mkdtemp(join(tmpdir(), "skill-usage-store-"));
    const path = join(root, "usage.jsonl");

    await appendSkillUsageEvent(
      {
        skillName: "imagegen",
        agentId: "codex",
        source: "hook",
        confidence: "exact",
        occurredAt: "2026-06-26T08:00:00.000Z",
      },
      path
    );
    const existing = await readFile(path, "utf8");
    await import("node:fs/promises").then(({ writeFile }) =>
      writeFile(path, `${existing}not-json\n{"skillName":"missing fields"}\n`, "utf8")
    );

    const events = await readSkillUsageEvents(path);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      skillName: "imagegen",
      agentId: "codex",
      source: "hook",
      confidence: "exact",
    });
  });

  it("rejects unsupported event sources", () => {
    expect(
      parseSkillUsageEventLine(
        JSON.stringify({
          id: "1",
          skillName: "imagegen",
          agentId: "codex",
          source: "unknown",
          confidence: "exact",
          occurredAt: "2026-06-26T08:00:00.000Z",
        })
      )
    ).toBeNull();
  });
});
