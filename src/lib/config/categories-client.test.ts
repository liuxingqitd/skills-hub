// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

const categories = [
  {
    id: "cat-search",
    name: "搜索检索",
    icon: "🌐",
    desc: "网络搜索",
    color: "oklch(55% 0.12 170)",
    order: 0,
    isPreset: true,
    keywords: [],
  },
];

const draft = {
  name: "开发工具",
  desc: "代码生成",
  icon: "🛠",
  color: "oklch(55% 0.12 45)",
};

describe("categories-client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("uses Web API fallbacks outside Tauri", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/categories" && !init?.method) return Response.json(categories);
      if (url === "/api/categories" && init?.method === "POST") {
        return Response.json({ id: "cat-new", ...draft, order: 1, isPreset: false, keywords: [] });
      }
      if (url === "/api/categories" && init?.method === "PUT") {
        return Response.json({ id: "cat-search", ...draft, order: 0, isPreset: true, keywords: [] });
      }
      if (url === "/api/categories?id=cat-search" && init?.method === "DELETE") {
        return Response.json({ ok: true });
      }
      return Response.json({}, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createCategory, deleteCategory, loadCategories, updateCategory } = await import("./categories-client");

    await expect(loadCategories()).resolves.toEqual(categories);
    await expect(createCategory(draft)).resolves.toEqual({
      id: "cat-new",
      ...draft,
      order: 1,
      isPreset: false,
      keywords: [],
    });
    await expect(updateCategory("cat-search", draft)).resolves.toEqual({
      id: "cat-search",
      ...draft,
      order: 0,
      isPreset: true,
      keywords: [],
    });
    await expect(deleteCategory("cat-search")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("/api/categories", { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories",
      expect.objectContaining({ method: "PUT" })
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/categories?id=cat-search", {
      method: "DELETE",
    });
  });

  it("uses Tauri commands inside desktop runtime", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_categories") return categories;
      if (command === "create_category") return { id: "cat-new", ...draft };
      if (command === "update_category") return { id: "cat-search", ...draft };
      if (command === "delete_category") return { ok: true };
      throw new Error(command);
    });
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.doMock("@tauri-apps/api/core", () => ({ invoke }));

    const { createCategory, deleteCategory, loadCategories, updateCategory } = await import("./categories-client");

    await expect(loadCategories()).resolves.toEqual(categories);
    await createCategory(draft);
    await updateCategory("cat-search", draft);
    await deleteCategory("cat-search");

    expect(invoke).toHaveBeenCalledWith("get_categories", undefined);
    expect(invoke).toHaveBeenCalledWith("create_category", { input: draft });
    expect(invoke).toHaveBeenCalledWith("update_category", {
      input: { id: "cat-search", ...draft },
    });
    expect(invoke).toHaveBeenCalledWith("delete_category", {
      input: { id: "cat-search" },
    });
  });
});
