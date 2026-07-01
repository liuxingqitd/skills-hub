// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LanguagePreference } from "@/src/lib/config/settings-store";

function setNavigatorLanguages(languages: readonly string[], language = languages[0] ?? "en-US") {
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    get: () => languages,
  });
  Object.defineProperty(navigator, "language", {
    configurable: true,
    get: () => language,
  });
}

async function renderI18nProbe(savedLanguage: LanguagePreference | null) {
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/settings" && !init?.method) {
      return Response.json({ syncMode: "copy", language: savedLanguage, instructionPaths: {} });
    }
    if (url === "/api/settings" && init?.method === "POST") {
      return Response.json(JSON.parse(String(init.body)));
    }
    return Response.json({}, { status: 404 });
  }));

  const { I18nProvider, useI18n } = await import("./i18n");

  function Probe() {
    const { language, languagePreference, t } = useI18n();
    return (
      <div>
        <div data-testid="language">{language}</div>
        <div data-testid="preference">{languagePreference}</div>
        <div data-testid="label">{t("settings.general")}</div>
      </div>
    );
  }

  return render(
    <I18nProvider>
      <Probe />
    </I18nProvider>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("uses browser language when preference is system", async () => {
    setNavigatorLanguages(["en-US"]);

    await renderI18nProbe("system");

    await waitFor(() => {
      expect(screen.getByTestId("preference").textContent).toBe("system");
      expect(screen.getByTestId("language").textContent).toBe("en");
      expect(screen.getByTestId("label").textContent).toBe("General");
      expect(document.documentElement.lang).toBe("en");
    });
  });

  it("updates system language on languagechange", async () => {
    setNavigatorLanguages(["en-US"]);

    await renderI18nProbe("system");

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("en");
    });

    setNavigatorLanguages(["zh-CN"]);
    window.dispatchEvent(new Event("languagechange"));

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("zh");
      expect(screen.getByTestId("label").textContent).toBe("通用设置");
      expect(document.documentElement.lang).toBe("zh-CN");
    });
  });

  it("does not follow languagechange when preference is fixed", async () => {
    setNavigatorLanguages(["en-US"]);

    await renderI18nProbe("zh");

    await waitFor(() => {
      expect(screen.getByTestId("preference").textContent).toBe("zh");
      expect(screen.getByTestId("language").textContent).toBe("zh");
    });

    setNavigatorLanguages(["en-US"]);
    window.dispatchEvent(new Event("languagechange"));

    await waitFor(() => {
      expect(screen.getByTestId("language").textContent).toBe("zh");
      expect(screen.getByTestId("label").textContent).toBe("通用设置");
    });
  });

  it("localizes preset categories and preserves custom categories", async () => {
    const { getLocalizedCategory } = await import("./i18n");
    const translate = (key: string) => ({
      "categories.cat-search.name": "Search & Retrieval",
      "categories.cat-search.desc": "Web search",
    })[key] ?? key;

    expect(getLocalizedCategory({
      id: "cat-search",
      name: "搜索检索",
      desc: "网络搜索",
      icon: "🌐",
      color: "oklch(55% 0.12 170)",
      order: 0,
      isPreset: true,
      keywords: [],
    }, translate)).toEqual({
      name: "Search & Retrieval",
      desc: "Web search",
    });

    expect(getLocalizedCategory({
      id: "cat-custom",
      name: "其他",
      desc: "用户自定义",
      icon: "🤖",
      color: "oklch(55% 0.12 170)",
      order: 1,
      isPreset: false,
      keywords: [],
    }, translate)).toEqual({
      name: "其他",
      desc: "用户自定义",
    });
  });
});
