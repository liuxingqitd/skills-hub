// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadInstructionPaths,
  loadInstructionsModel,
  saveInstructionAsset,
  saveInstructionPaths,
  selectInstructionFile,
} from "@/src/lib/instructions/instructions-client";

const emptyModel = {
  surfaces: [],
  assets: [],
};

describe("instructions client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("loads instructions through HTTP outside Tauri", async () => {
    const fetchMock = vi.fn(async () => Response.json(emptyModel));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadInstructionsModel()).resolves.toEqual(emptyModel);

    expect(fetchMock).toHaveBeenCalledWith("/api/instructions", { cache: "no-store" });
  });

  it("normalizes malformed instruction model payloads", async () => {
    const fetchMock = vi.fn(async () => Response.json({
      surfaces: [{ agent: "codex", assets: null }],
      assets: [
        {
          id: "codex:AGENTS.md",
          agent: "codex",
          exists: true,
          title: "~/.codex/AGENTS.md",
        },
      ],
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadInstructionsModel()).resolves.toEqual({
      surfaces: [{ agent: "codex", assets: [] }],
      assets: [
        expect.objectContaining({
          id: "codex:AGENTS.md",
          exists: false,
          contentPreview: null,
          isEditable: false,
          status: "missing",
        }),
      ],
    });
  });

  it("saves instructions through HTTP outside Tauri", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveInstructionAsset({
        path: "/tmp/AGENTS.md",
        content: "hello",
        previousHash: "abc",
      })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/instructions/update",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          path: "/tmp/AGENTS.md",
          content: "hello",
          previousHash: "abc",
        }),
      })
    );
  });

  it("loads and saves instruction paths through HTTP outside Tauri", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "/api/settings" && !init?.method) {
        return Response.json({ instructionPaths: { codex: "/tmp/custom/AGENTS.md" } });
      }
      return Response.json({ instructionPaths: { claude: "/tmp/custom/CLAUDE.md" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadInstructionPaths()).resolves.toEqual({ codex: "/tmp/custom/AGENTS.md" });
    await expect(saveInstructionPaths({ claude: "/tmp/custom/CLAUDE.md" })).resolves.toEqual({
      claude: "/tmp/custom/CLAUDE.md",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/settings", { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ instructionPaths: { claude: "/tmp/custom/CLAUDE.md" } }),
      })
    );
  });

  it("selects an instruction file through HTTP outside Tauri", async () => {
    const fetchMock = vi.fn(async () => Response.json({ path: "/tmp/custom/AGENTS.md" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(selectInstructionFile()).resolves.toBe("/tmp/custom/AGENTS.md");
    expect(fetchMock).toHaveBeenCalledWith("/api/system/select-file", { method: "POST" });
  });

  it("uses Tauri commands when running in a Tauri WebView", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_instructions_model") return emptyModel;
      if (command === "get_instruction_paths") return { codex: "/tmp/custom/AGENTS.md" };
      if (command === "set_instruction_paths") return { hermes: "/tmp/custom/HERMES.md" };
      if (command === "select_instruction_file") return { path: "/tmp/chosen/AGENTS.md" };
      return { ok: true, contentHash: "next" };
    });
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke };
    vi.stubGlobal("fetch", vi.fn());

    await expect(loadInstructionsModel()).resolves.toEqual(emptyModel);
    await expect(loadInstructionPaths()).resolves.toEqual({ codex: "/tmp/custom/AGENTS.md" });
    await expect(saveInstructionPaths({ hermes: "/tmp/custom/HERMES.md" })).resolves.toEqual({
      hermes: "/tmp/custom/HERMES.md",
    });
    await expect(selectInstructionFile()).resolves.toBe("/tmp/chosen/AGENTS.md");
    await expect(
      saveInstructionAsset({
        path: "/tmp/AGENTS.md",
        content: "hello",
        previousHash: "abc",
      })
    ).resolves.toEqual({ ok: true, contentHash: "next" });

    expect(invoke).toHaveBeenNthCalledWith(1, "get_instructions_model", {}, undefined);
    expect(invoke).toHaveBeenNthCalledWith(2, "get_instruction_paths", {}, undefined);
    expect(invoke).toHaveBeenNthCalledWith(
      3,
      "set_instruction_paths",
      {
        input: {
          instructionPaths: {
            hermes: "/tmp/custom/HERMES.md",
          },
        },
      },
      undefined
    );
    expect(invoke).toHaveBeenNthCalledWith(4, "select_instruction_file", {}, undefined);
    expect(invoke).toHaveBeenNthCalledWith(
      5,
      "update_instruction_asset",
      {
        input: {
          path: "/tmp/AGENTS.md",
          content: "hello",
          previousHash: "abc",
        },
      },
      undefined
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("normalizes Tauri command errors", async () => {
    const invoke = vi.fn(async () => {
      throw { ok: false, code: "STALE_CONTENT", error: "文件内容已经变化，请刷新后重试。" };
    });
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke };

    await expect(
      saveInstructionAsset({
        path: "/tmp/AGENTS.md",
        content: "hello",
        previousHash: "abc",
      })
    ).rejects.toThrow("文件内容已经变化，请刷新后重试。");
  });
});
