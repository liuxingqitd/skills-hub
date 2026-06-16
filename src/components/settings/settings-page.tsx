"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  ExternalLink,
  LayoutGrid,
  Monitor,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import type { AgentDefinition } from "@/src/types/agents";
import type { Category } from "@/src/types/categories";
import { useToast } from "@/src/components/ui/toast";
import { ConfirmDialog } from "@/src/components/ui/modal";
import { AgentIcon } from "@/src/components/ui/agent-icon";

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
  const [draftEnabledIds, setDraftEnabledIds] = useState<string[]>([]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        setCategories((await res.json()) as Category[]);
      }
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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Add failed: ${res.status}`);
      const created = (await res.json()) as Category;
      setCategories((prev) => [...prev, created]);
      setShowAddModal(false);
      addToast(`已添加分类「${data.name}」`);
    } catch {
      addToast("添加失败");
    }
  }

  async function handleEdit(id: string, data: { name: string; desc: string; icon: string; color: string }) {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error(`Edit failed: ${res.status}`);
      const updated = (await res.json()) as Category;
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingCat(null);
      addToast(`已更新分类「${data.name}」`);
    } catch {
      addToast("更新失败");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingCat(null);
      addToast("已删除分类");
    } catch {
      addToast("删除失败");
    }
  }

  async function handleRestoreDefaults() {
    setShowRestoreConfirm(false);
    try {
      // Delete all existing categories — use allSettled so one failure doesn't abort the rest
      const deleteResults = await Promise.allSettled(
        categories.map(async (cat) => {
          const res = await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
          return res;
        })
      );
      const deleteFailed = deleteResults.filter((r) => r.status === "rejected").length;

      // Create preset categories — likewise use allSettled for resilience
      const createResults = await Promise.allSettled(
        DEFAULT_PRESETS.map(async (preset) => {
          const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preset),
          });
          if (!res.ok) throw new Error(`Create failed: ${res.status}`);
          return res;
        })
      );
      const createFailed = createResults.filter((r) => r.status === "rejected").length;

      // Always resync UI state with server state to recover consistency
      await loadCategories();

      if (deleteFailed === 0 && createFailed === 0) {
        addToast("已恢复预设分类");
      } else {
        const parts: string[] = [];
        if (deleteFailed > 0) parts.push(`${deleteFailed} 个分类删除失败`);
        if (createFailed > 0) parts.push(`${createFailed} 个分类创建失败`);
        addToast(`恢复部分完成：${parts.join("，")}，已重新同步状态`);
      }
    } catch {
      // Recovery: resync UI state with server on any unexpected failure
      try { await loadCategories(); } catch { /* ignore */ }
      addToast("恢复失败，已重新加载分类状态");
    }
  }

  // ---- Agent management ----
  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as AgentDefinition[];
        setAgents(data);
        setDraftEnabledIds(data.filter((a) => a.enabled).map((a) => a.id));
      }
    } catch {
      // ignore
    } finally {
      setAgentsLoading(false);
    }
  }

  function toggleAgent(id: string) {
    const nextEnabledIds = draftEnabledIds.includes(id)
      ? draftEnabledIds.filter((x) => x !== id)
      : [...draftEnabledIds, id];
    setDraftEnabledIds(nextEnabledIds);
    void saveAgents(nextEnabledIds);
  }

  async function saveAgents(nextEnabledIds = draftEnabledIds) {
    setAgentsSaving(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledIds: nextEnabledIds }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data = (await res.json()) as AgentDefinition[];
      setAgents(data);
      setDraftEnabledIds(data.filter((agent) => agent.enabled).map((agent) => agent.id));
      addToast("Agent 配置已保存");
    } catch {
      addToast("保存失败");
    } finally {
      setAgentsSaving(false);
    }
  }

  return (
    <div className="main">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <Link href="/" className="btn-back">
            <ArrowLeft size={16} /> 返回
          </Link>
          <span className="topbar-title">设置</span>
        </div>
      </div>

      {/* Settings layout */}
      <div className="settings-layout">
        {/* Settings nav */}
        <nav className="settings-nav">
          <div className="settings-nav-label">设置</div>
          <div
            className={"settings-nav-item" + (activeTab === "categories" ? " active" : "")}
            onClick={() => setActiveTab("categories")}
          >
            <LayoutGrid size={16} /> 分类管理
          </div>
          <div
            className={"settings-nav-item" + (activeTab === "general" ? " active" : "")}
            onClick={() => setActiveTab("general")}
          >
            <Settings2 size={16} /> 通用设置
          </div>
          <div
            className={"settings-nav-item" + (activeTab === "agents" ? " active" : "")}
            onClick={() => { setActiveTab("agents"); loadAgents(); }}
          >
            <Monitor size={16} /> Agent 管理
          </div>
        </nav>

        {/* Settings panel */}
        <div className="settings-panel">
          {activeTab === "categories" && (
            <div className="settings-panel-content">
              <div className="panel-header">
                <div>
                  <div className="panel-title">分类管理</div>
                  <div className="panel-desc">
                    管理 Skill 的功能分类，共 {categories.length} 个分类。
                    每个 Skill 可关联多个分类，方便按功能快速筛选。
                  </div>
                </div>
                <div className="panel-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowRestoreConfirm(true)}
                  >
                    <RotateCcw size={12} /> 恢复预设
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={12} /> 新建分类
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
                  加载中……
                </div>
              ) : sorted.length === 0 ? (
                <div className="empty-state">
                  <LayoutGrid size={40} />
                  <div className="empty-state-title">暂无分类</div>
                  <div className="empty-state-desc">点击"新建分类"开始创建，或恢复预设分类。</div>
                </div>
              ) : (
                <div className="category-list">
                  {sorted.map((cat) => (
                    <div key={cat.id} className="category-card">
                      <div className="cat-color-dot" style={{ background: cat.color }} />
                      <div className="category-icon" style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)` }}>
                        {cat.icon}
                      </div>
                      <div className="category-info">
                        <div className="category-name-row">
                          <span className="category-name">{cat.name}</span>
                          {cat.isPreset && <span className="preset-badge">预设</span>}
                        </div>
                        <div className="category-desc">{cat.desc || "暂无描述"}</div>
                      </div>
                      <div className="category-actions">
                        <button
                          className="btn-icon-sm"
                          onClick={() => setEditingCat(cat)}
                          title="编辑"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn-icon-sm"
                          onClick={() => setDeletingCat(cat)}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                  <div className="panel-title">Agent 管理</div>
                  <div className="panel-desc">
                    管理所有 Coding Agent。启用的 Agent 将显示在首页并参与 Skill 同步。禁用后，首页不再展示该 Agent 及其同步状态。
                  </div>
                </div>
                <div className="panel-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => saveAgents()}
                    disabled={agentsSaving}
                  >
                    {agentsSaving ? "保存中……" : "已自动保存"}
                  </button>
                </div>
              </div>

              {agentsLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
                  加载中……
                </div>
              ) : agents.length === 0 ? (
                <div className="empty-state">
                  <Monitor size={40} />
                  <div className="empty-state-title">暂无 Agent</div>
                  <div className="empty-state-desc">Agent 注册表为空，请检查配置。</div>
                </div>
              ) : (
                <div className="category-list">
                  {agents.map((agent) => {
                    const isEnabled = draftEnabledIds.includes(agent.id);
                    return (
                      <div
                        key={agent.id}
                        className="category-card"
                        style={isEnabled ? undefined : { opacity: 0.55 }}
                      >
                        <img
                          src={`/icons/${agent.id}.svg`}
                          alt={agent.id}
                          width={36}
                          height={36}
                          style={{ borderRadius: "var(--radius-sm)", flexShrink: 0 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="category-info">
                          <div className="category-name-row">
                            <span className="category-name">{agent.name}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                              {agent.id}
                            </span>
                          </div>
                          <div className="category-desc">{agent.description}</div>
                          <div style={{ marginTop: 4 }}>
                            <a
                              href={agent.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 11, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={10} /> 官网
                            </a>
                          </div>
                        </div>
                        <div className="category-actions">
                          <label className="toggle-switch" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>
                              {isEnabled ? "已启用" : "已禁用"}
                            </span>
                            <div
                              style={{
                                width: 36,
                                height: 20,
                                borderRadius: 10,
                                background: isEnabled ? "var(--good)" : "var(--border)",
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
                                  left: isEnabled ? 18 : 2,
                                  transition: "left 0.2s",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                }}
                              />
                            </div>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleAgent(agent.id)}
                              disabled={agentsSaving}
                              style={{ display: "none" }}
                            />
                          </label>
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
        title={`删除分类「${deletingCat?.name ?? ""}」`}
        text="确定要删除此分类吗？所有关联的 Skill 将不再标记为此分类。"
        confirmLabel="删除"
        danger
        onConfirm={() => deletingCat && handleDelete(deletingCat.id)}
        onCancel={() => setDeletingCat(null)}
      />

      {/* Restore confirm */}
      <ConfirmDialog
        open={showRestoreConfirm}
        title="恢复预设分类"
        text="将重置所有分类为系统预设的 8 个默认分类。自定义分类将被移除。确定继续？"
        confirmLabel="恢复"
        onConfirm={handleRestoreDefaults}
        onCancel={() => setShowRestoreConfirm(false)}
      />
    </div>
  );
}

/* ============================================================
   General Settings
   ============================================================ */

function GeneralSettings() {
  const { addToast } = useToast();
  const [syncMode, setSyncMode] = useState<"copy" | "symlink">("copy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
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
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncMode: mode }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      addToast(mode === "symlink" ? "已切换为软链接模式" : "已切换为拷贝模式");
    } catch {
      addToast("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-panel-content">
        <div className="panel-header">
          <div>
            <div className="panel-title">通用设置</div>
            <div className="panel-desc">应用级别的通用配置。</div>
          </div>
        </div>
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>
          加载中……
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel-content">
      <div className="panel-header">
        <div>
          <div className="panel-title">通用设置</div>
          <div className="panel-desc">应用级别的通用配置。</div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Skill 同步方式</div>
        <div className="settings-group-desc">
          选择将 Skill 从数据源部署到各 Agent 目录的方式。切换后新操作立即生效，已同步的 Skill 不受影响。
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
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>拷贝文件夹</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              将 Skill 完整复制到每个 Agent 目录，各副本独立，磁盘占用较大但无耦合。
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
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>软链接</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              创建指向数据源的符号链接，所有 Agent 共享同一份文件，节省磁盘空间。
            </div>
          </label>
        </div>
        {saving && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>保存中……</div>
        )}
      </div>
    </div>
  );
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
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.desc || "");
  const [icon, setIcon] = useState(initial?.icon || "📦");
  const [color, setColor] = useState(initial?.color || CATEGORY_COLORS[0].value);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请输入分类名称");
      return;
    }
    if (trimmed.length > 20) {
      setError("名称不超过 20 个字符");
      return;
    }
    onSave({ name: trimmed, desc: desc.trim(), icon, color });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {mode === "add" ? "新建分类" : "编辑分类"}
        </div>
        <div className="modal-desc">
          {mode === "add"
            ? "添加一个新的 Skill 分类，方便按功能组织所有 Skill。"
            : "修改分类的名称、描述、图标或颜色。"}
        </div>

        <div className="modal-field">
          <label>名称</label>
          <input
            type="text"
            placeholder="例如：代码审查、自动化流程"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoFocus
          />
          {error && <div style={{ color: "var(--error)", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        <div className="modal-field">
          <label>描述</label>
          <textarea
            placeholder="简要描述此分类包含哪些类型的 Skill……"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>图标</label>
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
          <label>标识色</label>
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
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === "add" ? "添加分类" : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
