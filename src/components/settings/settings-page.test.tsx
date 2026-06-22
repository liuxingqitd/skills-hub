// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const agents = [
  {
    id: "claude",
    name: "Claude Code",
    skillsPath: "/tmp/claude",
    description: "Claude",
    homepage: "https://claude.ai/code",
    enabled: true,
  },
  {
    id: "cursor",
    name: "Cursor",
    skillsPath: "/tmp/cursor",
    description: "Cursor",
    homepage: "https://cursor.com",
    enabled: false,
  },
];

async function renderSettingsPage() {
  vi.stubGlobal("React", React);
  const [{ SettingsPage }, { ToastProvider }] = await Promise.all([
    import("./settings-page"),
    import("@/src/components/ui/toast"),
  ]);

  return render(
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>
  );
}

describe("SettingsPage agent management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("saves the newly enabled agent id as soon as the switch changes", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/categories") {
        return Response.json([]);
      }
      if (url === "/api/agents" && !init?.method) {
        return Response.json(agents);
      }
      if (url === "/api/agents" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return Response.json(
          body.agents ?? agents.map((agent) => ({
            ...agent,
            enabled: body.enabledIds.includes(agent.id),
          }))
        );
      }
      if (url === "/api/agents/validate-path") {
        const body = JSON.parse(String(init?.body));
        return Response.json({
          inputPath: body.path,
          resolvedPath: body.path,
          status: "ok",
          skillCount: 1,
          message: "已找到 1 个 Skill",
        });
      }
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderSettingsPage();

    fireEvent.click(screen.getByText("Agent 管理"));

    const cursorCard = await screen.findAllByText("Cursor").then((nodes) => {
      const node = nodes.find((item) => item.className === "agent-name");
      if (!node) throw new Error("Cursor name not found");
      const card = node.closest(".agent-card");
      if (!card) throw new Error("Cursor card not found");
      return card as HTMLElement;
    });

    fireEvent.click(within(cursorCard).getByText("已禁用"));

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/agents" && init?.method === "POST"
      );
      expect(saveCall).toBeTruthy();
      const body = JSON.parse(String(saveCall?.[1]?.body));
      expect(body.agents).toEqual([
        expect.objectContaining({ id: "claude", enabled: true }),
        expect.objectContaining({ id: "cursor", enabled: true }),
      ]);
    });
  });

  it("uses the directory picker to update and save an agent skills path", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/categories") {
        return Response.json([]);
      }
      if (url === "/api/agents" && !init?.method) {
        return Response.json(agents);
      }
      if (url === "/api/system/select-directory") {
        return Response.json({ path: "/tmp/chosen-skills" });
      }
      if (url === "/api/agents/validate-path") {
        const body = JSON.parse(String(init?.body));
        return Response.json({
          inputPath: body.path,
          resolvedPath: body.path,
          status: "ok",
          skillCount: 2,
          message: "已找到 2 个 Skill",
        });
      }
      if (url === "/api/agents" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return Response.json(body.agents);
      }
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderSettingsPage();

    fireEvent.click(screen.getByText("Agent 管理"));

    const claudeCard = await screen.findAllByText("Claude Code").then((nodes) => {
      const node = nodes.find((item) => item.className === "agent-name");
      if (!node) throw new Error("Claude name not found");
      const card = node.closest(".agent-card");
      if (!card) throw new Error("Claude card not found");
      return card as HTMLElement;
    });

    fireEvent.click(within(claudeCard).getByText("选择"));

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/agents" && init?.method === "POST"
      );
      expect(saveCall).toBeTruthy();
      const body = JSON.parse(String(saveCall?.[1]?.body));
      expect(body.agents).toEqual([
        expect.objectContaining({ id: "claude", skillsPath: "/tmp/chosen-skills" }),
        expect.objectContaining({ id: "cursor" }),
      ]);
    });
  });

  it("hides agent ids when adding a custom agent and generates one from the name", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/categories") {
        return Response.json([]);
      }
      if (url === "/api/agents" && !init?.method) {
        return Response.json(agents);
      }
      if (url === "/api/agents/validate-path") {
        const body = JSON.parse(String(init?.body));
        return Response.json({
          inputPath: body.path,
          resolvedPath: body.path,
          status: "ok",
          skillCount: 1,
          message: "已找到 1 个 Skill",
        });
      }
      if (url === "/api/agents" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return Response.json(body.agents);
      }
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderSettingsPage();

    fireEvent.click(screen.getByText("Agent 管理"));
    fireEvent.click(await screen.findByText("新增 Agent"));

    expect(screen.queryByText("Agent ID")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("例如：My Local Agent"), {
      target: { value: "My Local Agent" },
    });
    fireEvent.change(screen.getByPlaceholderText("/Users/me/.my-agent/skills"), {
      target: { value: "/tmp/my-local-agent-skills" },
    });
    fireEvent.click(screen.getByText("添加 Agent"));

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/agents" && init?.method === "POST"
      );
      expect(saveCall).toBeTruthy();
      const body = JSON.parse(String(saveCall?.[1]?.body));
      expect(body.agents).toEqual([
        expect.objectContaining({ id: "claude" }),
        expect.objectContaining({ id: "cursor" }),
        expect.objectContaining({
          id: "my-local-agent",
          name: "My Local Agent",
          skillsPath: "/tmp/my-local-agent-skills",
          enabled: true,
          builtin: false,
        }),
      ]);
    });
  });
});
