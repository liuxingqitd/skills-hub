import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}));

vi.mock("@/src/lib/config/settings-store", () => ({
  readSettings: mocks.readSettings,
  writeSettings: mocks.writeSettings,
}));

describe("/api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSettings.mockResolvedValue({
      syncMode: "copy",
      language: "system",
      instructionPaths: {},
    });
    mocks.writeSettings.mockResolvedValue(undefined);
  });

  it("preserves custom agent instruction paths when saving settings", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({
          instructionPaths: {
            openclaw: "/tmp/openclaw/AGENTS.md",
            codex: "/tmp/codex/AGENTS.md",
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.writeSettings).toHaveBeenCalledWith({
      syncMode: "copy",
      language: "system",
      instructionPaths: {
        openclaw: "/tmp/openclaw/AGENTS.md",
        codex: "/tmp/codex/AGENTS.md",
      },
    });
    await expect(response.json()).resolves.toMatchObject({
      instructionPaths: {
        openclaw: "/tmp/openclaw/AGENTS.md",
        codex: "/tmp/codex/AGENTS.md",
      },
    });
  });

  it("saves a language preference", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ language: "en" }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.writeSettings).toHaveBeenCalledWith({
      syncMode: "copy",
      language: "en",
      instructionPaths: {},
    });
    await expect(response.json()).resolves.toMatchObject({ language: "en" });
  });

  it("saves system language preference", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ language: "system" }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.writeSettings).toHaveBeenCalledWith({
      syncMode: "copy",
      language: "system",
      instructionPaths: {},
    });
    await expect(response.json()).resolves.toMatchObject({ language: "system" });
  });
});
