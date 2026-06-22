// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadInstructionsModel,
  saveInstructionAsset,
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

  it("uses Tauri commands when running in a Tauri WebView", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_instructions_model") return emptyModel;
      return { ok: true, contentHash: "next" };
    });
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke };
    vi.stubGlobal("fetch", vi.fn());

    await expect(loadInstructionsModel()).resolves.toEqual(emptyModel);
    await expect(
      saveInstructionAsset({
        path: "/tmp/AGENTS.md",
        content: "hello",
        previousHash: "abc",
      })
    ).resolves.toEqual({ ok: true, contentHash: "next" });

    expect(invoke).toHaveBeenNthCalledWith(1, "get_instructions_model", {}, undefined);
    expect(invoke).toHaveBeenNthCalledWith(
      2,
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
