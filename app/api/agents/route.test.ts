import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  writeEnabledAgentIds: vi.fn(),
  loadAllRegistryAgents: vi.fn(),
  invalidateOverviewModelCache: vi.fn(),
}));

vi.mock("@/src/lib/config/agent-registry-store", () => ({
  writeEnabledAgentIds: mocks.writeEnabledAgentIds,
}));

vi.mock("@/src/lib/config/load-agents", () => ({
  loadAllRegistryAgents: mocks.loadAllRegistryAgents,
}));

vi.mock("@/src/lib/server/build-overview-model", () => ({
  invalidateOverviewModelCache: mocks.invalidateOverviewModelCache,
}));

describe("/api/agents", () => {
  it("invalidates the overview cache after saving enabled agents", async () => {
    mocks.writeEnabledAgentIds.mockResolvedValue(undefined);
    mocks.loadAllRegistryAgents.mockResolvedValue([
      {
        id: "claude",
        name: "Claude",
        skillsPath: "/tmp/claude",
        description: "",
        homepage: "",
        enabled: true,
      },
    ]);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/agents", {
        method: "POST",
        body: JSON.stringify({ enabledIds: ["claude"] }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.writeEnabledAgentIds).toHaveBeenCalledWith(["claude"]);
    expect(mocks.invalidateOverviewModelCache).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({ id: "claude", enabled: true }),
    ]);
  });
});
