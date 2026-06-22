import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";

export type SyncRequestBody = { skillName: string | null; types: string[] };

export type InstallResult = {
  discovered: Array<{ name: string }>;
  completed: Array<{
    skillName: string;
    agentId: string;
    agentName: string;
    targetPath: string;
  }>;
  skipped: Array<{
    skillName: string;
    agentId: string;
    agentName: string;
    targetPath: string;
    reason: string;
  }>;
  failed: Array<{
    skillName: string;
    agentId: string;
    agentName: string;
    targetPath: string;
    error: string;
  }>;
};

export async function runDashboardSync(body: SyncRequestBody) {
  if (isTauriRuntime()) {
    return invokeTauri<{
      completed: unknown[];
      skipped: unknown[];
      failed: Array<{ agentName: string; error: string }>;
    }>("apply_sync_actions", { input: body });
  }

  const res = await fetch("/api/sync/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`同步失败：${res.status}`);
  return (await res.json()) as {
    completed: unknown[];
    skipped: unknown[];
    failed: Array<{ agentName: string; error: string }>;
  };
}

export async function installDashboardSkill(source: string): Promise<InstallResult> {
  if (isTauriRuntime()) {
    return invokeTauri<InstallResult>("install_skill_source_command", { input: { source } });
  }

  const res = await fetch("/api/skills/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  const data = (await res.json()) as InstallResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `安装失败：${res.status}`);
  return data;
}

export async function removeDashboardSkill(skillName: string) {
  if (isTauriRuntime()) {
    return invokeTauri("remove_skill", { input: { skillName } });
  }

  const res = await fetch("/api/sync/remove", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillName }),
  });
  if (!res.ok) throw new Error(`删除失败：${res.status}`);
}

export async function setDashboardCustomSkill(skillName: string, isCustom: boolean) {
  if (isTauriRuntime()) {
    return invokeTauri("set_custom_skill", { input: { skillName, isCustom } });
  }

  const res = await fetch("/api/custom-tag", {
    method: isCustom ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillName }),
  });
  if (!res.ok) throw new Error(`更新失败：${res.status}`);
}

export async function setDashboardSkillCategories(skillName: string, categoryIds: string[]) {
  if (isTauriRuntime()) {
    return invokeTauri("set_skill_categories_command", {
      input: { skillName, categoryIds },
    });
  }

  const res = await fetch("/api/skill-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillName, categoryIds }),
  });
  if (!res.ok) throw new Error(`更新失败：${res.status}`);
}

export async function loadDashboardSkillContent(path: string): Promise<string> {
  if (isTauriRuntime()) {
    const result = await invokeTauri<{ content?: string }>("get_skill_content", {
      input: { path },
    });
    return result.content ?? "未找到 SKILL.md。";
  }

  const url = `/api/skills/content?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) return "未找到 SKILL.md。";
  const data = (await res.json()) as { content?: string };
  return data.content ?? "未找到 SKILL.md。";
}
