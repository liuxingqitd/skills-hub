// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import type { SkillBoardModel } from "@/src/types/board";

const model: SkillBoardModel = {
  agents: [
    {
      id: "codex",
      name: "Codex",
      skillsPath: "/tmp/codex/skills",
      description: "Codex",
      homepage: "",
      enabled: true,
      builtin: true,
    },
  ],
  rows: [],
  categories: [],
  pendingSyncCount: 0,
};

describe("skill-board-client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("returns null outside Tauri so Web keeps the server component model", async () => {
    const { loadRuntimeSkillBoardModel } = await import("./skill-board-client");

    await expect(loadRuntimeSkillBoardModel()).resolves.toBeNull();
  });

  it("loads the board model from Tauri inside the desktop runtime", async () => {
    const invoke = vi.fn(async () => model);
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));

    const { loadRuntimeSkillBoardModel } = await import("./skill-board-client");

    await expect(loadRuntimeSkillBoardModel()).resolves.toEqual(model);
    expect(invoke).toHaveBeenCalledWith("get_skill_board_model", undefined);
  });
});
