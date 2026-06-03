"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  LayoutGrid,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import type { Category } from "@/src/types/categories";
import { useToast } from "@/src/components/ui/toast";
import { ConfirmDialog } from "@/src/components/ui/modal";

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
  const [activeTab, setActiveTab] = useState<"categories" | "general">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

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
            <div className="settings-panel-content">
              <div className="panel-header">
                <div>
                  <div className="panel-title">通用设置</div>
                  <div className="panel-desc">应用级别的通用配置。</div>
                </div>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
                更多设置项即将支持
              </div>
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
