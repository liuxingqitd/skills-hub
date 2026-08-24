"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  ExternalLink,
  FolderOpen,
  LayoutGrid,
  Monitor,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import type { AgentDefinition, AgentPathValidation } from "@/src/types/agents";
import type { Category } from "@/src/types/categories";
import { useToast } from "@/src/components/ui/toast";
import { ConfirmDialog, Modal } from "@/src/components/ui/modal";
import {
  loadAgentDefinitions,
  saveAgentDefinitions,
  validateAgentSkillsPath,
} from "@/src/lib/config/agents-client";
import {
  createCategory,
  deleteCategory,
  loadCategories as loadCategoryDefinitions,
  updateCategory,
} from "@/src/lib/config/categories-client";
import { loadAppSettings, saveAppSettings } from "@/src/lib/config/settings-client";
import type { LanguagePreference } from "@/src/lib/config/settings-store";
import { getLocalizedCategory, useI18n } from "@/src/lib/i18n";

/* ---- Presets ---- */
const PRESET_EMOJIS = [
  "🔍","🌐","✨","📊","📄","🛠","🤖","🧪","🚀","🔒",
  "🎨","⚡","🧩","📝","🎯","💻","🔧","📡","🔄","📱",
];

const CATEGORY_COLORS = [
  { name: "靛蓝", value: "oklch(55% 0.15 240)" },
  { name: "青绿", value: "oklch(55% 0.12 170)" },
  { name: "紫色", value: "oklch(55% 0.15 300)" },
  { name: "金色", value: "oklch(55% 0.12 80)" },
  { name: "橙色", value: "oklch(55% 0.12 45)" },
  { name: "玫红", value: "oklch(55% 0.14 10)" },
  { name: "翠绿", value: "oklch(55% 0.12 145)" },
  { name: "天蓝", value: "oklch(55% 0.12 220)" },
  { name: "灰色", value: "oklch(55% 0.02 240)" },
  { name: "粉紫", value: "oklch(55% 0.14 320)" },
];

const DEFAULT_PRESETS: Category[] = [
  { id: "cat-code-review", name: "代码审查", icon: "🔍", desc: "代码差异审查、逻辑缺陷检测、安全审计", color: "oklch(55% 0.15 240)", order: 0, isPreset: true, keywords: [] },
  { id: "cat-search", name: "搜索检索", icon: "🌐", desc: "网络搜索、文档检索、信息提取", color: "oklch(55% 0.12 170)", order: 1, isPreset: true, keywords: [] },
  { id: "cat-content", name: "内容生成", icon: "✨", desc: "文本、图片、演示文稿等内容创作", color: "oklch(55% 0.15 300)", order: 2, isPreset: true, keywords: [] },
  { id: "cat-data", name: "数据分析", icon: "📊", desc: "数据探索、统计分析、可视化", color: "oklch(55% 0.12 80)", order: 3, isPreset: true, keywords: [] },
  { id: "cat-dev-tools", name: "开发工具", icon: "🛠", desc: "代码生成、重构、开发流程辅助", color: "oklch(55% 0.12 45)", order: 4, isPreset: true, keywords: [] },
  { id: "cat-test", name: "测试质量", icon: "🧪", desc: "自动化测试、质量检查、覆盖率", color: "oklch(55% 0.12 145)", order: 5, isPreset: true, keywords: [] },
  { id: "cat-devops", name: "部署运维", icon: "🚀", desc: "CI/CD、部署管理、运行监控", color: "oklch(55% 0.12 220)", order: 6, isPreset: true, keywords: [] },
];

/* ============================================================
   Settings Page
   ============================================================ */

export function SettingsPage() {
  const { addToast } = useToast();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"categories" | "general" | "agents">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Agent management state
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsSaving, setAgentsSaving] = useState(false);
  const [pathChecks, setPathChecks] = useState<Record<string, AgentPathValidation>>({});
  const [checkingPathIds, setCheckingPathIds] = useState<string[]>([]);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<AgentDefinition | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await loadCategoryDefinitions());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sorted = useMemo(() =>
    [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  // ---- CRUD ----
  async function handleAdd(data: { name: string; desc: string; icon: string; color: string }) {
    try {
      const created = await createCategory(data);
      setCategories((prev) => [...prev, created]);
      setShowAddModal(false);
      addToast(t("settings.categories.added", { name: data.name }));
    } catch {
      addToast(t("settings.categories.addFailed"));
    }
  }

  async function handleEdit(id: string, data: { name: string; desc: string; icon: string; color: string }) {
    try {
      const updated = await updateCategory(id, data);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingCat(null);
      addToast(t("settings.categories.updated", { name: data.name }));
    } catch {
      addToast(t("settings.categories.updateFailed"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingCat(null);
      addToast(t("settings.categories.deleted"));
    } catch {
      addToast(t("settings.categories.deleteFailed"));
    }
  }

  async function handleRestoreDefaults() {
    setShowRestoreConfirm(false);
    try {
      for (const cat of categories) {
        await deleteCategory(cat.id);
      }

      for (const preset of DEFAULT_PRESETS) {
        await createCategory(preset);
      }

      // Always resync UI state with server state to recover consistency
      await loadCategories();
      addToast(t("settings.categories.restored"));
    } catch {
      // Recovery: resync UI state with server on any unexpected failure
      try { await loadCategories(); } catch { /* ignore */ }
      addToast(t("settings.categories.restoreFailed"));
    }
  }

  // ---- Agent management ----
  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const data = await loadAgentDefinitions();
      setAgents(data);
      void Promise.all(data.map((agent) => validateAgentPath(agent.id, agent.skillsPath)));
    } catch {
      // ignore
    } finally {
      setAgentsLoading(false);
    }
  }

  function toggleAgent(id: string) {
    const nextAgents = agents.map((agent) =>
      agent.id === id ? { ...agent, enabled: !agent.enabled } : agent
    );
    setAgents(nextAgents);
    void saveAgents(nextAgents);
  }

  async function saveAgents(nextAgents = agents) {
    setAgentsSaving(true);
    try {
      const data = await saveAgentDefinitions(nextAgents);
      setAgents(data);
      addToast(t("settings.agents.saved"));
    } catch {
      addToast(t("settings.saveFailed"));
    } finally {
      setAgentsSaving(false);
    }
  }

  async function validateAgentPath(agentId: string, path: string) {
    setCheckingPathIds((prev) => (prev.includes(agentId) ? prev : [...prev, agentId]));
    try {
      const data = await validateAgentSkillsPath(path);
      setPathChecks((prev) => ({ ...prev, [agentId]: data }));
    } catch {
      setPathChecks((prev) => ({
        ...prev,
        [agentId]: {
          inputPath: path,
          resolvedPath: path,
          status: "missing",
          skillCount: 0,
          message: t("settings.agents.checkFailed"),
        },
      }));
    } finally {
      setCheckingPathIds((prev) => prev.filter((id) => id !== agentId));
    }
  }

  function updateAgentPath(id: string, skillsPath: string) {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === id ? { ...agent, skillsPath } : agent))
    );
  }

  async function saveAgentPath(id: string) {
    const nextAgents = agents.map((agent) => ({ ...agent }));
    const agent = nextAgents.find((item) => item.id === id);
    if (!agent) return;
    await saveAgents(nextAgents);
    await validateAgentPath(id, agent.skillsPath);
  }

  async function chooseAgentPath(id: string) {
    try {
      const res = await fetch("/api/system/select-directory", { method: "POST" });
      if (!res.ok) throw new Error("Directory picker unavailable");
      const data = (await res.json()) as { path: string };
      if (!data.path) return;
      const nextAgents = agents.map((agent) =>
        agent.id === id ? { ...agent, skillsPath: data.path } : agent
      );
      setAgents(nextAgents);
      await saveAgents(nextAgents);
      await validateAgentPath(id, data.path);
    } catch {
      addToast(t("settings.agents.pickerFailed"));
    }
  }

  async function addCustomAgent(data: { name: string; skillsPath: string }) {
    const id = createUniqueAgentId(data.name, agents);
    const nextAgents: AgentDefinition[] = [
      ...agents,
      {
        id,
        name: data.name,
        skillsPath: data.skillsPath,
        description: t("settings.agents.custom"),
        homepage: "",
        enabled: true,
        builtin: false,
      },
    ];
    setAgents(nextAgents);
    setShowAddAgentModal(false);
    await saveAgents(nextAgents);
    await validateAgentPath(id, data.skillsPath);
  }

  async function deleteCustomAgent(agentId: string) {
    const agent = agents.find((item) => item.id === agentId);
    if (agent?.builtin) {
      addToast(t("settings.agents.cannotDeleteBuiltin"));
      return;
    }
    const nextAgents = agents.filter((item) => item.id !== agentId);
    setAgents(nextAgents);
    setDeletingAgent(null);
    await saveAgents(nextAgents);
  }

  return (
    <div className="main">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <Link href={"/dashboard" as Route} className="btn-back">
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
          <span className="topbar-title">{t("settings.title")}</span>
        </div>
      </div>

      {/* Settings layout */}
      <div className="settings-layout">
        {/* Settings nav */}
        <nav className="settings-nav">
          <div className="settings-nav-label">{t("settings.title")}</div>
          <div
            className={"settings-nav-item" + (activeTab === "categories" ? " active" : "")}
            onClick={() => setActiveTab("categories")}
          >
            <LayoutGrid size={16} /> {t("settings.categories")}
          </div>
          <div
            className={"settings-nav-item" + (activeTab === "general" ? " active" : "")}
            onClick={() => setActiveTab("general")}
          >
            <Settings2 size={16} /> {t("settings.general")}
          </div>
          <div
            className={"settings-nav-item" + (activeTab === "agents" ? " active" : "")}
            onClick={() => { setActiveTab("agents"); loadAgents(); }}
          >
            <Monitor size={16} /> {t("settings.agents")}
          </div>
        </nav>

        {/* Settings panel */}
        <div className="settings-panel">
          {activeTab === "categories" && (
            <div className="settings-panel-content">
              <div className="panel-header">
                <div>
                  <div className="panel-title">{t("settings.categories")}</div>
                  <div className="panel-desc">
                    {t("settings.categories.desc", { count: categories.length })}
                  </div>
                </div>
                <div className="panel-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowRestoreConfirm(true)}
                  >
                    <RotateCcw size={12} /> {t("settings.categories.restore")}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={12} /> {t("settings.categories.new")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
                  {t("common.loading")}
                </div>
              ) : sorted.length === 0 ? (
                <div className="empty-state">
                  <LayoutGrid size={40} />
                  <div className="empty-state-title">{t("settings.categories.emptyTitle")}</div>
                  <div className="empty-state-desc">{t("settings.categories.emptyDesc")}</div>
                </div>
              ) : (
                <div className="category-list">
                  {sorted.map((cat) => {
                    const localized = getLocalizedCategory(cat, t);
                    return (
                      <div key={cat.id} className="category-card">
                        <div className="cat-color-dot" style={{ background: cat.color }} />
                        <div className="category-icon" style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)` }}>
                          {cat.icon}
                        </div>
                        <div className="category-info">
                          <div className="category-name-row">
                            <span className="category-name">{localized.name}</span>
                            {cat.isPreset && <span className="preset-badge">{t("settings.categories.preset")}</span>}
                          </div>
                          <div className="category-desc">{localized.desc || t("settings.categories.noDesc")}</div>
                        </div>
                        <div className="category-actions">
                          <button
                            className="btn-icon-sm"
                            onClick={() => setEditingCat(cat)}
                            title={t("settings.categoryModal.editTitle")}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn-icon-sm"
                            onClick={() => setDeletingCat(cat)}
                            title={t("common.delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "general" && (
            <GeneralSettings />
          )}

          {activeTab === "agents" && (
            <div className="settings-panel-content">
              <div className="panel-header">
                <div>
                  <div className="panel-title">{t("settings.agents")}</div>
                  <div className="panel-desc">
                    {t("settings.agents.desc")}
                  </div>
                </div>
                <div className="panel-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowAddAgentModal(true)}
                  >
                    <Plus size={12} /> {t("settings.agents.new")}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => saveAgents()}
                    disabled={agentsSaving}
                  >
                    {agentsSaving ? t("common.saving") : t("settings.agents.autoSaved")}
                  </button>
                </div>
              </div>

              {agentsLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
                  {t("common.loading")}
                </div>
              ) : agents.length === 0 ? (
                <div className="empty-state">
                  <Monitor size={40} />
                  <div className="empty-state-title">{t("settings.agents.emptyTitle")}</div>
                  <div className="empty-state-desc">{t("settings.agents.emptyDesc")}</div>
                </div>
              ) : (
                <div className="agent-list">
                  {agents.map((agent) => {
                    const pathCheck = pathChecks[agent.id];
                    const isChecking = checkingPathIds.includes(agent.id);
                    return (
                      <div
                        key={agent.id}
                        className={"agent-card" + (agent.enabled ? "" : " is-disabled")}
                      >
                        <AgentLogo agent={agent} />
                        <div className="agent-main">
                          <div className="agent-title-row">
                            <span className="agent-name">{agent.name}</span>
                            {agent.builtin && <span className="preset-badge">{t("settings.agents.builtin")}</span>}
                          </div>
                          <div className="agent-desc">
                            {agent.description || t("settings.agents.custom")}
                            {agent.homepage && (
                              <a
                                href={agent.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={10} /> {t("settings.agents.website")}
                              </a>
                            )}
                          </div>
                          <div className="agent-path-row">
                            <input
                              className="agent-path-input"
                              value={agent.skillsPath}
                              onChange={(e) => updateAgentPath(agent.id, e.target.value)}
                              onBlur={() => saveAgentPath(agent.id)}
                              placeholder={t("settings.agents.pathPlaceholder")}
                            />
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => chooseAgentPath(agent.id)}
                              disabled={agentsSaving}
                              title={t("settings.agents.chooseFolder")}
                            >
                              <FolderOpen size={12} /> {t("common.choose")}
                            </button>
                            <button
                              className="btn-icon-sm"
                              onClick={() => validateAgentPath(agent.id, agent.skillsPath)}
                              disabled={isChecking}
                              title={t("settings.agents.checkPath")}
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                          <div className={"agent-path-status agent-path-status--" + (pathCheck?.status ?? "empty")}>
                            {isChecking ? t("settings.agents.checking") : pathCheck?.message ?? t("settings.agents.notChecked")}
                            {pathCheck?.resolvedPath && pathCheck.resolvedPath !== agent.skillsPath && (
                              <span> · {pathCheck.resolvedPath}</span>
                            )}
                          </div>
                        </div>
                        <div className="agent-actions">
                          <label className="toggle-switch" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>
                              {agent.enabled ? t("settings.agents.enabled") : t("settings.agents.disabled")}
                            </span>
                            <div
                              style={{
                                width: 36,
                                height: 20,
                                borderRadius: 10,
                                background: agent.enabled ? "var(--good)" : "var(--border)",
                                position: "relative",
                                transition: "background 0.2s",
                              }}
                            >
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  background: "#fff",
                                  position: "absolute",
                                  top: 2,
                                  left: agent.enabled ? 18 : 2,
                                  transition: "left 0.2s",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                }}
                              />
                            </div>
                            <input
                              type="checkbox"
                              checked={agent.enabled}
                              onChange={() => toggleAgent(agent.id)}
                              disabled={agentsSaving}
                              style={{ display: "none" }}
                            />
                          </label>
                          {!agent.builtin && (
                            <button
                              className="btn-icon-sm"
                              onClick={() => setDeletingAgent(agent)}
                              title={t("settings.agents.deleteCustom")}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <CategoryModal
          mode="add"
          onSave={(data) => handleAdd(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingCat && (
        <CategoryModal
          mode="edit"
          initial={editingCat}
          onSave={(data) => handleEdit(editingCat.id, data)}
          onClose={() => setEditingCat(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deletingCat !== null}
        title={t("settings.categories.deleteTitle", {
          name: deletingCat ? getLocalizedCategory(deletingCat, t).name : "",
        })}
        text={t("settings.categories.deleteText")}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={() => deletingCat && handleDelete(deletingCat.id)}
        onCancel={() => setDeletingCat(null)}
      />

      {/* Restore confirm */}
      <ConfirmDialog
        open={showRestoreConfirm}
        title={t("settings.categories.restoreTitle")}
        text={t("settings.categories.restoreText")}
        confirmLabel={t("settings.categories.restore")}
        onConfirm={handleRestoreDefaults}
        onCancel={() => setShowRestoreConfirm(false)}
      />

      <AgentModal
        open={showAddAgentModal}
        agents={agents}
        onSave={addCustomAgent}
        onClose={() => setShowAddAgentModal(false)}
      />

      <ConfirmDialog
        open={deletingAgent !== null}
        title={t("settings.agents.deleteTitle", { name: deletingAgent?.name ?? "" })}
        text={t("settings.agents.deleteText")}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={() => deletingAgent && deleteCustomAgent(deletingAgent.id)}
        onCancel={() => setDeletingAgent(null)}
      />
    </div>
  );
}

/* ============================================================
   General Settings
   ============================================================ */

function GeneralSettings() {
  const { addToast } = useToast();
  const { languagePreference, setLanguage, t } = useI18n();
  const [syncMode, setSyncMode] = useState<"copy" | "symlink">("copy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAppSettings()
      .then((data) => {
        if (data.syncMode) setSyncMode(data.syncMode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleChange(mode: "copy" | "symlink") {
    setSyncMode(mode);
    setSaving(true);
    try {
      await saveAppSettings({ syncMode: mode });
      addToast(t(mode === "symlink" ? "settings.sync.saved.symlink" : "settings.sync.saved.copy"));
    } catch {
      addToast(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleLanguageChange(nextLanguage: LanguagePreference) {
    setSaving(true);
    try {
      await setLanguage(nextLanguage);
      addToast(t(`settings.language.saved.${nextLanguage}`));
    } catch {
      addToast(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-panel-content">
        <div className="panel-header">
          <div>
            <div className="panel-title">{t("settings.general")}</div>
            <div className="panel-desc">{t("settings.general.desc")}</div>
          </div>
        </div>
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel-content">
      <div className="panel-header">
        <div>
          <div className="panel-title">{t("settings.general")}</div>
          <div className="panel-desc">{t("settings.general.desc")}</div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">{t("settings.language.title")}</div>
        <div className="settings-group-desc">
          {t("settings.language.desc")}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {(["system", "zh", "en"] as const).map((option) => (
            <button
              key={option}
              className={"btn btn-sm " + (languagePreference === option ? "btn-primary" : "btn-outline")}
              onClick={() => handleLanguageChange(option)}
              disabled={saving || languagePreference === option}
              type="button"
            >
              {t(`settings.language.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">{t("settings.sync.title")}</div>
        <div className="settings-group-desc">
          {t("settings.sync.desc")}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <label
            style={{
              flex: 1,
              padding: "12px 16px",
              border: `1.5px solid ${syncMode === "copy" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              background: syncMode === "copy" ? "var(--accent-subtle)" : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <input
              type="radio"
              name="syncMode"
              value="copy"
              checked={syncMode === "copy"}
              onChange={() => handleChange("copy")}
              disabled={saving}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t("settings.sync.copy")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {t("settings.sync.copyDesc")}
            </div>
          </label>

          <label
            style={{
              flex: 1,
              padding: "12px 16px",
              border: `1.5px solid ${syncMode === "symlink" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              background: syncMode === "symlink" ? "var(--accent-subtle)" : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <input
              type="radio"
              name="syncMode"
              value="symlink"
              checked={syncMode === "symlink"}
              onChange={() => handleChange("symlink")}
              disabled={saving}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t("settings.sync.symlink")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {t("settings.sync.symlinkDesc")}
            </div>
          </label>
        </div>
        {saving && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>{t("common.saving")}</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Agent helpers
   ============================================================ */

function AgentLogo({ agent }: { agent: AgentDefinition }) {
  const [failed, setFailed] = useState(false);
  const first = agent.name.trim().charAt(0) || agent.id.charAt(0) || "A";
  const src = `/icons/${agent.id}.svg`;

  return (
    <div className="agent-logo" aria-hidden>
      {!failed ? (
        <img
          src={src}
          alt=""
          width={28}
          height={28}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{first.toUpperCase()}</span>
      )}
    </div>
  );
}

function AgentModal({
  open,
  agents,
  onSave,
  onClose,
}: {
  open: boolean;
  agents: AgentDefinition[];
  onSave: (data: { name: string; skillsPath: string }) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [skillsPath, setSkillsPath] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setSkillsPath("");
      setError("");
    }
  }, [open]);

  function handleNameChange(nextName: string) {
    setName(nextName);
    setError("");
  }

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedPath = skillsPath.trim();
    if (!trimmedName) {
      setError(t("settings.agentModal.nameRequired"));
      return;
    }
    if (!trimmedPath) {
      setError(t("settings.agentModal.pathRequired"));
      return;
    }
    onSave({ name: trimmedName, skillsPath: trimmedPath });
  }

  async function choosePath() {
    try {
      const res = await fetch("/api/system/select-directory", { method: "POST" });
      if (!res.ok) throw new Error("Directory picker unavailable");
      const data = (await res.json()) as { path: string };
      if (data.path) {
        setSkillsPath(data.path);
        setError("");
      }
    } catch {
      setError(t("settings.agents.pickerFailed"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.agentModal.title")}
      description={t("settings.agentModal.desc")}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{t("settings.agentModal.add")}</button>
        </>
      }
    >
      <div className="modal-field">
        <label>{t("settings.agentModal.name")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t("settings.agentModal.namePlaceholder")}
          autoFocus
        />
      </div>
      <div className="modal-field">
        <label>{t("settings.agentModal.path")}</label>
        <div className="agent-path-row">
          <input
            className="agent-path-input"
            type="text"
            value={skillsPath}
            onChange={(e) => { setSkillsPath(e.target.value); setError(""); }}
            placeholder="/Users/me/.my-agent/skills"
          />
          <button className="btn btn-outline btn-sm" onClick={choosePath}>
            <FolderOpen size={12} /> {t("common.choose")}
          </button>
        </div>
      </div>
      {error && <div style={{ color: "var(--error)", fontSize: 12, marginTop: 8 }}>{error}</div>}
    </Modal>
  );
}

function slugifyAgentId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueAgentId(name: string, agents: AgentDefinition[]): string {
  const existingIds = new Set(agents.map((agent) => agent.id));
  const base = slugifyAgentId(name) || "custom-agent";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

/* ============================================================
   Category Modal
   ============================================================ */

function CategoryModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: Category;
  onSave: (data: { name: string; desc: string; icon: string; color: string }) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.desc || "");
  const [icon, setIcon] = useState(initial?.icon || "📦");
  const [color, setColor] = useState(initial?.color || CATEGORY_COLORS[0].value);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("settings.categoryModal.nameRequired"));
      return;
    }
    if (trimmed.length > 20) {
      setError(t("settings.categoryModal.nameTooLong"));
      return;
    }
    onSave({ name: trimmed, desc: desc.trim(), icon, color });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {mode === "add" ? t("settings.categoryModal.addTitle") : t("settings.categoryModal.editTitle")}
        </div>
        <div className="modal-desc">
          {mode === "add"
            ? t("settings.categoryModal.addDesc")
            : t("settings.categoryModal.editDesc")}
        </div>

        <div className="modal-field">
          <label>{t("settings.categoryModal.name")}</label>
          <input
            type="text"
            placeholder={t("settings.categoryModal.namePlaceholder")}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoFocus
          />
          {error && <div style={{ color: "var(--error)", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        <div className="modal-field">
          <label>{t("settings.categoryModal.desc")}</label>
          <textarea
            placeholder={t("settings.categoryModal.descPlaceholder")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>{t("settings.categoryModal.icon")}</label>
          <div className="modal-emoji-grid">
            {PRESET_EMOJIS.map((e) => (
              <div
                key={e}
                className={"modal-emoji-option" + (icon === e ? " selected" : "")}
                onClick={() => setIcon(e)}
              >
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-field">
          <label>{t("settings.categoryModal.color")}</label>
          <div className="color-options">
            {CATEGORY_COLORS.map((c) => (
              <div
                key={c.value}
                className={"color-option" + (color === c.value ? " selected" : "")}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === "add" ? t("settings.categoryModal.add") : t("settings.categoryModal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
