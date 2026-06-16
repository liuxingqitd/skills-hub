// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
          agents.map((agent) => ({
            ...agent,
            enabled: body.enabledIds.includes(agent.id),
          }))
        );
      }
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderSettingsPage();

    fireEvent.click(screen.getByText("Agent 管理"));

    const cursorCard = await screen.findAllByText("Cursor").then((nodes) => {
      const node = nodes.find((item) => item.className === "category-name");
      if (!node) throw new Error("Cursor name not found");
      const card = node.closest(".category-card");
      if (!card) throw new Error("Cursor card not found");
      return card as HTMLElement;
    });

    fireEvent.click(within(cursorCard).getByText("已禁用"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agents",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ enabledIds: ["claude", "cursor"] }),
        })
      );
    });
  });
});
