import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendSkillUsageEvent: vi.fn(),
}));

vi.mock("@/src/lib/usage/usage-store", () => ({
  appendSkillUsageEvent: mocks.appendSkillUsageEvent,
}));

describe("/api/usage/record", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.appendSkillUsageEvent.mockResolvedValue({
      id: "event-1",
      skillName: "imagegen",
      agentId: "codex",
      source: "hook",
      confidence: "exact",
      occurredAt: "2026-06-26T08:00:00.000Z",
    });
  });

  it("appends a skill usage event", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/usage/record", {
        method: "POST",
        body: JSON.stringify({
          skillName: "imagegen",
          agentId: "codex",
          source: "hook",
          occurredAt: "2026-06-26T08:00:00.000Z",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.appendSkillUsageEvent).toHaveBeenCalledWith({
      skillName: "imagegen",
      agentId: "codex",
      source: "hook",
      confidence: "exact",
      occurredAt: "2026-06-26T08:00:00.000Z",
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      event: expect.objectContaining({
        skillName: "imagegen",
        agentId: "codex",
      }),
    });
  });

  it("rejects invalid usage payloads", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/usage/record", {
        method: "POST",
        body: JSON.stringify({
          skillName: "",
          agentId: "codex",
          source: "unknown",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.appendSkillUsageEvent).not.toHaveBeenCalled();
  });
});
