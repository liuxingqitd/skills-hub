import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";
import type { AppSettings, LanguagePreference, SyncMode } from "@/src/lib/config/settings-store";

type SettingsPatch = Partial<Pick<AppSettings, "instructionPaths">> & {
  syncMode?: SyncMode;
  language?: LanguagePreference;
};

export async function loadAppSettings(): Promise<AppSettings> {
  if (isTauriRuntime()) {
    return invokeTauri<AppSettings>("get_app_settings");
  }

  const res = await fetch("/api/settings", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载设置失败：${res.status}`);
  return (await res.json()) as AppSettings;
}

export async function saveAppSettings(patch: SettingsPatch): Promise<AppSettings> {
  if (isTauriRuntime()) {
    return invokeTauri<AppSettings>("set_app_settings", { patch });
  }

  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`保存设置失败：${res.status}`);
  return (await res.json()) as AppSettings;
}
