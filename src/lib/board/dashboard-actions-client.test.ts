// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

describe("dashboard-actions-client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("uses Web API fallbacks outside Tauri", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/sync/apply") return Response.json({ completed: [], skipped: [], failed: [] });
      if (url === "/api/custom-tag") return Response.json({ ok: true });
      if (url === "/api/skill-categories") return Response.json({ ok: true });
      if (url.startsWith("/api/skills/content")) return Response.json({ content: "skill" });
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const {
      loadDashboardSkillContent,
      runDashboardSync,
      setDashboardCustomSkill,
      setDashboardSkillCategories,
    } = await import("./dashboard-actions-client");

    await expect(runDashboardSync({ skillName: null, types: ["create_copy"] })).resolves.toEqual({
      completed: [],
      skipped: [],
      failed: [],
    });
    await setDashboardCustomSkill("skill-a", true);
    await setDashboardSkillCategories("skill-a", ["cat-a"]);
    await expect(loadDashboardSkillContent("/tmp/SKILL.md")).resolves.toBe("skill");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-tag",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/skill-categories",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("uses Tauri commands inside desktop runtime", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_skill_content") return { content: "desktop skill" };
      if (command === "apply_sync_actions") return { completed: [], skipped: [], failed: [] };
      if (command === "install_skill_source_command") {
        return { discovered: [], completed: [], skipped: [], failed: [] };
      }
      return { ok: true };
    });
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));

    const {
      installDashboardSkill,
      loadDashboardSkillContent,
      removeDashboardSkill,
      runDashboardSync,
      setDashboardCustomSkill,
      setDashboardSkillCategories,
    } = await import("./dashboard-actions-client");

    await runDashboardSync({ skillName: "skill-a", types: ["repair_copy"] });
    await installDashboardSkill("/tmp/source");
    await removeDashboardSkill("skill-a");
    await setDashboardCustomSkill("skill-a", false);
    await setDashboardSkillCategories("skill-a", []);
    await expect(loadDashboardSkillContent("/tmp/SKILL.md")).resolves.toBe("desktop skill");

    expect(invoke).toHaveBeenCalledWith("apply_sync_actions", {
      input: { skillName: "skill-a", types: ["repair_copy"] },
    });
    expect(invoke).toHaveBeenCalledWith("install_skill_source_command", {
      input: { source: "/tmp/source" },
    });
    expect(invoke).toHaveBeenCalledWith("remove_skill", {
      input: { skillName: "skill-a" },
    });
    expect(invoke).toHaveBeenCalledWith("set_custom_skill", {
      input: { skillName: "skill-a", isCustom: false },
    });
    expect(invoke).toHaveBeenCalledWith("set_skill_categories_command", {
      input: { skillName: "skill-a", categoryIds: [] },
    });
    expect(invoke).toHaveBeenCalledWith("get_skill_content", {
      input: { path: "/tmp/SKILL.md" },
    });
  });
});
