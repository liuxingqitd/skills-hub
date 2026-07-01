// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InstructionsPageModel } from "@/src/types/instructions";

const modelWithMissingFirstAsset: InstructionsPageModel = {
  surfaces: [],
  assets: [
    {
      id: "claude:CLAUDE.md",
      agent: "claude",
      kind: "main",
      scope: "user",
      status: "missing",
      path: "/tmp/.claude/CLAUDE.md",
      exists: false,
      title: "~/.claude/CLAUDE.md",
      description: "Claude Code 的用户级全局指令文件。",
      loadBehavior: "对这台机器上的所有 Claude Code 项目生效。",
      priority: 0,
      parentPath: null,
      contentPreview: null,
      contentHash: null,
      isEditable: false,
      canCreate: false,
    },
    {
      id: "codex:AGENTS.md",
      agent: "codex",
      kind: "main",
      scope: "user",
      status: "found",
      path: "/tmp/.codex/AGENTS.md",
      exists: true,
      title: "~/.codex/AGENTS.md",
      description: "Codex 的全局 AGENTS 指令文件。",
      loadBehavior: "作为 Codex 的用户级基础说明。",
      priority: 0,
      parentPath: null,
      contentPreview: "# Codex rules",
      contentHash: "abc123",
      isEditable: true,
      canCreate: false,
    },
  ],
};

async function renderEditorPage(model: InstructionsPageModel) {
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/instructions") return Response.json(model);
    if (url === "/api/settings" && !init?.method) {
      return Response.json({ syncMode: "copy", language: "zh", instructionPaths: {} });
    }
    if (url === "/api/settings" && init?.method === "POST") {
      return Response.json(JSON.parse(String(init.body)));
    }
    return Response.json({}, { status: 404 });
  }));
  const [{ EditorPage }, { ToastProvider }, { I18nProvider }] = await Promise.all([
    import("./editor-page"),
    import("@/src/components/ui/toast"),
    import("@/src/lib/i18n"),
  ]);

  return render(
    <I18nProvider>
      <ToastProvider>
        <EditorPage />
      </ToastProvider>
    </I18nProvider>
  );
}

describe("EditorPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("opens the first existing editable instruction instead of a missing asset", async () => {
    await renderEditorPage(modelWithMissingFirstAsset);

    await waitFor(() => {
      expect(screen.getByDisplayValue("# Codex rules")).toBeTruthy();
    });
    expect(screen.queryByText("没有可编辑的文件")).toBeNull();
  });
});
