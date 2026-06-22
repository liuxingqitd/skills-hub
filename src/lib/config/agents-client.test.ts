// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

const agents = [
  {
    id: "claude",
    name: "Claude Code",
    skillsPath: "/tmp/claude",
    description: "Claude",
    homepage: "https://claude.ai/code",
    enabled: true,
    builtin: true,
  },
];

describe("agents-client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("loads agents through the Web API outside Tauri", async () => {
    const fetchMock = vi.fn(async () => Response.json(agents));
    vi.stubGlobal("fetch", fetchMock);

    const { loadAgentDefinitions } = await import("./agents-client");

    await expect(loadAgentDefinitions()).resolves.toEqual(agents);
    expect(fetchMock).toHaveBeenCalledWith("/api/agents", { cache: "no-store" });
  });

  it("loads and saves agents through Tauri commands inside Tauri", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_agents") return agents;
      if (command === "save_agents_config") return agents;
      throw new Error(command);
    });
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));

    const { loadAgentDefinitions, saveAgentDefinitions } = await import("./agents-client");

    await expect(loadAgentDefinitions()).resolves.toEqual(agents);
    await expect(saveAgentDefinitions(agents)).resolves.toEqual(agents);
    expect(invoke).toHaveBeenCalledWith("get_agents", undefined);
    expect(invoke).toHaveBeenCalledWith("save_agents_config", { input: { agents } });
  });

  it("validates agent paths through Tauri commands inside Tauri", async () => {
    const result = {
      inputPath: "/tmp/skills",
      resolvedPath: "/tmp/skills",
      status: "ok",
      skillCount: 1,
      message: "已找到 1 个 Skill",
    };
    const invoke = vi.fn(async () => result);
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));

    const { validateAgentSkillsPath } = await import("./agents-client");

    await expect(validateAgentSkillsPath("/tmp/skills")).resolves.toEqual(result);
    expect(invoke).toHaveBeenCalledWith("validate_agent_path", {
      input: { path: "/tmp/skills" },
    });
  });
});
