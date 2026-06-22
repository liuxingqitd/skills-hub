"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ChevronRight,
  Grid3X3,
  HardDriveDownload,
  Link2,
  List,
  LoaderCircle,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { SkillBoardModel, SkillBoardRow } from "@/src/types/board";
import { useToast } from "@/src/components/ui/toast";
import { Badge } from "@/src/components/ui/badge";
import { ConfirmDialog } from "@/src/components/ui/modal";
import { AgentIcon } from "@/src/components/ui/agent-icon";
import { loadRuntimeSkillBoardModel } from "@/src/lib/board/skill-board-client";
import {
  installDashboardSkill,
  loadDashboardSkillContent,
  removeDashboardSkill,
  runDashboardSync,
  setDashboardCustomSkill,
  setDashboardSkillCategories,
  type InstallResult,
  type SyncRequestBody,
} from "@/src/lib/board/dashboard-actions-client";

/* ============================================================
   Types
   ============================================================ */

type ViewMode = "card" | "list";
type FilterMode = "all" | "needs_sync" | "broken";
/* ============================================================
   Dashboard Page
   ============================================================ */

const Icons = {
  grid: <Grid3X3 size={16} />,
  list: <List size={16} />,
};

export function DashboardPage({ model }: { model: SkillBoardModel }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [activeModel, setActiveModel] = useState(model);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selectedSkill, setSelectedSkill] = useState<SkillBoardRow | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installSource, setInstallSource] = useState("");
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([]);
  const [skillContent, setSkillContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const uiLocked = isPending || busyAction !== null;

  function isBusy(key: string) {
    return busyAction === key;
  }

  function refresh() {
    startTransition(() => {
      void loadRuntimeSkillBoardModel()
        .then((nextModel) => {
          if (nextModel) setActiveModel(nextModel);
          else router.refresh();
        })
        .catch(() => router.refresh());
    });
  }

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeModel.rows.filter((row) => {
      if (selectedCategory === "__custom" && !row.isCustom) return false;
      if (selectedCategory === "__opensource" && row.isCustom) return false;
      if (selectedCategory && selectedCategory !== "__custom" && selectedCategory !== "__opensource" && !row.categoryIds.includes(selectedCategory)) return false;
      if (filterMode === "needs_sync" && !row.canSync) return false;
      if (filterMode === "broken" && !row.cells.some((c) => c.displayStatus === "broken")) {
        return false;
      }
      if (!q) return true;
      return `${row.name} ${row.description}`.toLowerCase().includes(q);
    });
  }, [activeModel.rows, searchQuery, filterMode, selectedCategory]);

  const filteredSkill = selectedSkill
    ? activeModel.rows.find((r) => r.name === selectedSkill.name) ?? null
    : null;

  // ---- Stats ----
  const counts = useMemo(() => {
    const all = activeModel.rows.length;
    const installed = activeModel.rows.filter((r) =>
      r.cells.every((c) => c.displayStatus === "installed")
    ).length;
    const needsSync = activeModel.rows.filter((r) => r.canSync).length;
    const broken = activeModel.rows.filter((r) =>
      r.cells.some((c) => c.displayStatus === "broken")
    ).length;
    const custom = activeModel.rows.filter((r) => r.isCustom).length;
    return { all, installed, needsSync, broken, custom };
  }, [activeModel.rows]);

  useEffect(() => {
    let cancelled = false;
    loadRuntimeSkillBoardModel()
      .then((nextModel) => {
        if (!cancelled && nextModel) setActiveModel(nextModel);
      })
      .catch(() => {
        if (!cancelled) setSyncError("桌面数据加载失败，请重新打开应用。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- API calls ----
  async function runSync(body: SyncRequestBody, key: string) {
    setSyncError(null);
    setInstallResult(null);
    setBusyAction(key);
    try {
      const result = await runDashboardSync(body);
      if (result.failed?.length > 0) {
        const reasons = result.failed.map((f: { agentName: string; error: string }) => `${f.agentName}: ${f.error}`).join("；");
        throw new Error(`同步失败：${reasons}`);
      }
      if (result.completed?.length > 0) {
        addToast(`同步完成（${result.completed.length} 项）`);
      } else {
        addToast("无需同步");
      }
      refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "同步失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleInstall() {
    const source = installSource.trim();
    if (!source) return;
    setSyncError(null);
    setInstallResult(null);
    setBusyAction("install");
    try {
      const data = await installDashboardSkill(source);
      setInstallResult(data);
      setInstallSource("");
      setShowInstallModal(false);
      addToast(`已安装 ${data.discovered.map((s) => s.name).join("、")}`);
      refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "安装失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteSkill() {
    if (!filteredSkill) return;
    setShowDeleteConfirm(false);
    setBusyAction(`delete:${filteredSkill.name}`);
    try {
      await removeDashboardSkill(filteredSkill.name);
      setSelectedSkill(null);
      addToast(`已删除 ${filteredSkill.name}`);
      refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleCustom(skillName: string, isCustom: boolean) {
    setBusyAction(`tag:${skillName}`);
    try {
      await setDashboardCustomSkill(skillName, !isCustom);
      addToast(isCustom ? "已取消自研标记" : "已标记为自研");
      refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setBusyAction(null);
    }
  }

  // ---- Close detail on Escape ----
  useEffect(() => {
    if (!selectedSkill) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedSkill(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedSkill]);

  // ---- Lazy-load skill content when a skill is selected ----
  useEffect(() => {
    if (!selectedSkill) {
      setSkillContent(null);
      return;
    }
    let cancelled = false;
    setIsLoadingContent(true);
    setSkillContent(null);
    loadDashboardSkillContent(selectedSkill.skillFilePath)
      .then((content) => {
        if (!cancelled) {
          setSkillContent(content);
          setIsLoadingContent(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSkillContent("未找到 SKILL.md。");
          setIsLoadingContent(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSkill]);

  // ---- Reset category editor when a different skill is selected ----
  useEffect(() => {
    if (filteredSkill) {
      setDraftCategoryIds([...filteredSkill.categoryIds]);
      setShowCategoryEditor(false);
    }
  }, [filteredSkill?.name]);

  return (
    <div className="main">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索 Skill……"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-soft" onClick={() => setShowInstallModal(true)}>
          <Link2 size={14} /> 安装
        </button>
        <button
          className="btn btn-primary"
          onClick={() => runSync({ skillName: null, types: ["create_copy", "repair_copy"] }, "sync-all")}
          disabled={uiLocked || activeModel.pendingSyncCount === 0}
        >
          {isBusy("sync-all") ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {isBusy("sync-all") ? "同步中……" : "同步全部"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="scroll">
        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">全部 Skill</div>
            <div className="stat-value">{counts.all}</div>
            <div className="stat-change up">
              <ArrowUp size={12} /> {counts.installed} 已同步
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">连接 Agent</div>
            <div className="stat-value">{activeModel.agents.length}</div>
            <div className="stat-change up">
              <ArrowUp size={12} /> {activeModel.agents.filter((a) => a.enabled).length} 个在线
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">待同步</div>
            <div className="stat-value">{counts.needsSync}</div>
            <div
              className="stat-change"
              style={counts.needsSync > 0 ? { color: "var(--warn)" } : { color: "var(--good)" }}
            >
              {counts.needsSync > 0 ? "需同步变更" : "全部已同步"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">来源分布</div>
            <div className="stat-value">{counts.all}</div>
            <div className="stat-change" style={{ color: "var(--muted2)" }}>
              自研 {counts.custom} · 开源 {counts.all - counts.custom}
            </div>
          </div>
        </div>

        {/* Error */}
        {syncError && (
          <div className="error-state" role="alert">
            <TriangleAlert size={16} />
            {syncError}
          </div>
        )}

        {/* Install result */}
        {installResult && (
          <div className="install-result" role="status">
            <strong>{installResult.discovered.map((s) => s.name).join("、")}</strong>
            <span>已安装 {installResult.completed.length}</span>
            <span>跳过 {installResult.skipped.length}</span>
            <span>失败 {installResult.failed.length}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="category-filter">
          {([
            { key: "all" as const, label: "全部", count: counts.all },
            { key: "needs_sync" as const, label: "待同步", count: counts.needsSync },
            { key: "broken" as const, label: "异常", count: counts.broken },
          ]).map((f) => (
            <div
              key={f.key}
              className={"category-chip" + (filterMode === f.key ? " active" : "")}
              onClick={() => setFilterMode(f.key)}
            >
              {f.label}{" "}
              <span className="category-chip-count">
                {f.count}
              </span>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <CategoryFilterBar
          model={activeModel}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Section header */}
        <div className="section-header">
          <div>
            <div className="section-title">所有 Skill</div>
            <div className="section-sub">
              共 {rows.length} 个，管理已安装的 Skill
            </div>
          </div>
          <div className="view-toggle">
            <button
              className={viewMode === "card" ? "active" : ""}
              onClick={() => setViewMode("card")}
              title="卡片视图"
            >
              {Icons.grid}
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="列表视图"
            >
              {Icons.list}
            </button>
          </div>
        </div>

        {/* Skill list / grid */}
        {rows.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <div className="empty-state-title">没有找到匹配的 Skill</div>
            <div className="empty-state-desc">试试调整搜索关键词</div>
          </div>
        ) : viewMode === "card" ? (
          <div className="skill-grid">
            {rows.map((row) => (
              <SkillCard
                key={row.name}
                row={row}
                categories={activeModel.categories}
                onClick={() => setSelectedSkill(row)}
                onSync={(e) => {
                  e.stopPropagation();
                  runSync(
                    { skillName: row.name, types: ["create_copy", "repair_copy"] },
                    `sync:${row.name}`
                  );
                }}
                isSyncing={isBusy(`sync:${row.name}`)}
              />
            ))}
          </div>
        ) : (
          <div className="skill-list">
            {rows.map((row) => (
              <SkillRow
                key={row.name}
                row={row}
                categories={activeModel.categories}
                onClick={() => setSelectedSkill(row)}
                onSync={(e) => {
                  e.stopPropagation();
                  runSync(
                    { skillName: row.name, types: ["create_copy", "repair_copy"] },
                    `sync:${row.name}`
                  );
                }}
                isSyncing={isBusy(`sync:${row.name}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Install modal */}
      {showInstallModal && (
        <InstallModal
          installSource={installSource}
          uiLocked={uiLocked}
          isInstalling={isBusy("install")}
          onClose={() => { setShowInstallModal(false); setInstallSource(""); }}
          onSourceChange={setInstallSource}
          onInstall={handleInstall}
        />
      )}

      {/* Skill detail drawer */}
      {filteredSkill && (
        <SkillDetailDrawer
          skill={filteredSkill}
          categories={activeModel.categories}
          uiLocked={uiLocked}
          skillContent={skillContent}
          showCategoryEditor={showCategoryEditor}
          draftCategoryIds={draftCategoryIds}
          isSyncing={isBusy(`sync:${filteredSkill.name}`)}
          isTagging={isBusy(`tag:${filteredSkill.name}`)}
          isSavingCategory={isBusy(`cat:${filteredSkill.name}`)}
          onClose={() => setSelectedSkill(null)}
          onToggleCustom={() => handleToggleCustom(filteredSkill.name, filteredSkill.isCustom)}
          onSync={() =>
            runSync(
              { skillName: filteredSkill.name, types: ["create_copy", "repair_copy"] },
              `sync:${filteredSkill.name}`
            )
          }
          onEditCategories={() => setShowCategoryEditor(true)}
          onCancelCategoryEdit={() => {
            setDraftCategoryIds([...filteredSkill.categoryIds]);
            setShowCategoryEditor(false);
          }}
          onDraftCategoryChange={setDraftCategoryIds}
          onSaveCategories={async () => {
            setBusyAction(`cat:${filteredSkill.name}`);
            try {
              await setDashboardSkillCategories(filteredSkill.name, draftCategoryIds);
              addToast("分类已更新");
              setShowCategoryEditor(false);
              refresh();
            } catch (err) {
              setSyncError(err instanceof Error ? err.message : "更新分类失败");
            } finally {
              setBusyAction(null);
            }
          }}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={`删除「${filteredSkill?.name ?? ""}」`}
        text="此操作将从所有 Agent 及源目录中彻底删除此 Skill，不可恢复。"
        confirmLabel="删除"
        danger
        onConfirm={handleDeleteSkill}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

/* ============================================================
   CategoryFilterBar
   ============================================================ */

function CategoryFilterBar({
  model,
  selectedCategory,
  onCategoryChange,
}: {
  model: SkillBoardModel;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}) {
  return (
    <div className="category-filter" style={{ marginTop: -12, marginBottom: 16 }}>
      <div
        className={"category-chip" + (selectedCategory === null ? " active" : "")}
        onClick={() => onCategoryChange(null)}
      >
        全部分类
      </div>
      <div
        className={"category-chip" + (selectedCategory === "__custom" ? " active" : "")}
        onClick={() => onCategoryChange(selectedCategory === "__custom" ? null : "__custom")}
        style={selectedCategory === "__custom" ? { background: "var(--warm)", borderColor: "var(--warm)" } : undefined}
      >
        🏠 自研{" "}
        <span className="category-chip-count">{model.rows.filter((r) => r.isCustom).length}</span>
      </div>
      <div
        className={"category-chip" + (selectedCategory === "__opensource" ? " active" : "")}
        onClick={() => onCategoryChange(selectedCategory === "__opensource" ? null : "__opensource")}
        style={selectedCategory === "__opensource" ? { background: "var(--good)", borderColor: "var(--good)" } : undefined}
      >
        📖 开源{" "}
        <span className="category-chip-count">{model.rows.filter((r) => !r.isCustom).length}</span>
      </div>
      {model.categories.map((cat) => {
        const count = model.rows.filter((r) => r.categoryIds.includes(cat.id)).length;
        return (
          <div
            key={cat.id}
            className={"category-chip" + (selectedCategory === cat.id ? " active" : "")}
            onClick={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
            style={selectedCategory === cat.id ? { background: cat.color, borderColor: cat.color } : undefined}
          >
            {cat.icon} {cat.name}{" "}
            <span className="category-chip-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   InstallModal
   ============================================================ */

function InstallModal({
  installSource,
  uiLocked,
  isInstalling,
  onClose,
  onSourceChange,
  onInstall,
}: {
  installSource: string;
  uiLocked: boolean;
  isInstalling: boolean;
  onClose: () => void;
  onSourceChange: (value: string) => void;
  onInstall: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">通过链接安装 Skill</div>
        <div className="modal-desc">粘贴 GitHub 或市场链接，自动安装对应的 Skill</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onInstall();
          }}
        >
          <input
            className="modal-input"
            type="text"
            placeholder="https://github.com/xxx/skill-repo"
            value={installSource}
            onChange={(e) => onSourceChange(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uiLocked || !installSource.trim()}
            >
              {isInstalling ? "安装中……" : "安装"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   SkillDetailDrawer
   ============================================================ */

function SkillDetailDrawer({
  skill,
  categories,
  uiLocked,
  showCategoryEditor,
  draftCategoryIds,
  isSyncing,
  isTagging,
  isSavingCategory,
  skillContent,
  onClose,
  onToggleCustom,
  onSync,
  onEditCategories,
  onCancelCategoryEdit,
  onDraftCategoryChange,
  onSaveCategories,
  onDeleteClick,
}: {
  skill: SkillBoardRow;
  categories: SkillBoardModel["categories"];
  uiLocked: boolean;
  showCategoryEditor: boolean;
  draftCategoryIds: string[];
  isSyncing: boolean;
  isTagging: boolean;
  isSavingCategory: boolean;
  skillContent: string | null;
  onClose: () => void;
  onToggleCustom: () => void;
  onSync: () => void;
  onEditCategories: () => void;
  onCancelCategoryEdit: () => void;
  onDraftCategoryChange: React.Dispatch<React.SetStateAction<string[]>>;
  onSaveCategories: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Hero */}
        <div className="detail-hero">
          <div className="detail-hero-icon">
            {skill.name.charAt(0).toUpperCase()}
          </div>
          <div className="detail-hero-info">
            <div className="detail-hero-name">
              {skill.name}
              {skill.isCustom ? (
                <Badge variant="self">自研</Badge>
              ) : (
                <Badge variant="opensource">开源</Badge>
              )}
            </div>
            <div className="detail-hero-desc">{skill.description}</div>
          </div>
          <div className="detail-hero-actions">
            <button
              className="btn btn-sm btn-outline"
              onClick={onToggleCustom}
              disabled={uiLocked}
            >
              {isTagging ? (
                <LoaderCircle size={12} className="spin" />
              ) : (
                <Tag size={12} />
              )}
              {skill.isCustom ? "取消自研" : "标记自研"}
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onSync}
              disabled={uiLocked || !skill.canSync}
            >
              {isSyncing ? (
                <LoaderCircle size={12} className="spin" />
              ) : (
                <HardDriveDownload size={12} />
              )}
              同步
            </button>
          </div>
        </div>

        {/* Source */}
        <div className="detail-card">
          <div className="detail-card-label">源文件</div>
          <div className="detail-card-content" style={{ fontFamily: "var(--font-mono)", fontSize: 12, wordBreak: "break-all" }}>
            {skill.skillFilePath}
          </div>
        </div>

        {/* Agent statuses */}
        <div className="detail-card">
          <div className="detail-card-label">Agent 安装状态</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {skill.cells.map((cell) => (
              <div
                key={cell.agentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{cell.agentName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>
                    {cell.targetPath}
                  </div>
                </div>
                <span className="board-status" data-status={cell.displayStatus}>
                  {cell.displayStatus === "installed" ? "已安装" : cell.displayStatus === "missing" ? "缺失" : "异常"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="detail-card">
          <div className="detail-card-label">分类</div>
          <div className="detail-card-content">
            {!showCategoryEditor ? (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {skill.categoryIds.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--muted2)" }}>暂未分类</span>
                  ) : (
                    skill.categoryIds.map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      if (!cat) return null;
                      return (
                        <Badge key={catId} variant="custom"
                          style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)`, color: cat.color }}
                        >
                          {cat.icon} {cat.name}
                        </Badge>
                      );
                    })
                  )}
                </div>
                <button className="btn btn-sm btn-ghost" onClick={onEditCategories}>
                  编辑分类
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {categories.map((cat) => {
                    const checked = draftCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="cat-checkbox-row"
                        style={{ background: checked ? `color-mix(in oklch, ${cat.color} 10%, transparent)` : "transparent" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            onDraftCategoryChange((prev) =>
                              checked ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                        />
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        <span style={{ fontSize: 11, color: "var(--muted2)", marginLeft: "auto" }}>{cat.desc}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={uiLocked}
                    onClick={onSaveCategories}
                  >
                    {isSavingCategory ? "保存中……" : "保存"}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={onCancelCategoryEdit}
                  >
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {skillContent && skillContent !== "未找到 SKILL.md。" && (
          <div className="detail-card">
            <div className="detail-card-label">Skill 内容</div>
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                background: "var(--surface2)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                lineHeight: 1.6,
                overflow: "auto",
                maxHeight: 400,
                fontFamily: "var(--font-mono)",
              }}
            >
              <code>{skillContent}</code>
            </pre>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            className="btn btn-sm btn-danger"
            onClick={onDeleteClick}
            disabled={uiLocked}
          >
            <Trash2 size={12} /> 删除 Skill
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SkillCard (grid view)
   ============================================================ */

function SkillCard({
  row,
  categories,
  onClick,
  onSync,
  isSyncing,
}: {
  row: SkillBoardRow;
  categories: SkillBoardModel["categories"];
  onClick: () => void;
  onSync: (e: React.MouseEvent) => void;
  isSyncing: boolean;
}) {
  return (
    <div className="skill-card" onClick={onClick}>
      <div className="skill-card-header">
        <div className="skill-icon">
          {row.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="skill-card-title">{row.name}</div>
          <div className="skill-card-desc">{row.description}</div>
          <div className="skill-card-tags">
            {row.isCustom ? (
              <Badge variant="self">自研</Badge>
            ) : (
              <Badge variant="opensource">开源</Badge>
            )}
            {row.categoryIds.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <Badge key={catId} variant="custom"
                  style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)`, color: cat.color }}
                >
                  {cat.icon} {cat.name}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
      <div className="skill-card-footer">
        <div className="skill-card-agents">
          {row.cells.map((cell) => (
            <AgentIcon key={cell.agentId} agentId={cell.agentId} status={cell.displayStatus} size={18} />
          ))}
        </div>
        <button
          className={"btn-icon-sync" + (isSyncing ? " syncing" : "")}
          onClick={onSync}
          disabled={isSyncing || !row.canSync}
          title="同步到 Agent"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SkillRow (list view)
   ============================================================ */

function SkillRow({
  row,
  categories,
  onClick,
  onSync,
  isSyncing,
}: {
  row: SkillBoardRow;
  categories: SkillBoardModel["categories"];
  onClick: () => void;
  onSync: (e: React.MouseEvent) => void;
  isSyncing: boolean;
}) {
  return (
    <div className="skill-row" onClick={onClick}>
      <div className="skill-row-icon">
        {row.name.charAt(0).toUpperCase()}
      </div>
      <div className="skill-row-info">
        <div className="skill-row-name">{row.name}</div>
        <div className="skill-row-desc">{row.description}</div>
      </div>
      <div className="skill-row-tags">
        {row.isCustom ? (
          <Badge variant="self">自研</Badge>
        ) : (
          <Badge variant="opensource">开源</Badge>
        )}
        {row.categoryIds.map((catId) => {
          const cat = categories.find((c) => c.id === catId);
          if (!cat) return null;
          return (
            <Badge key={catId} variant="custom"
              style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)`, color: cat.color }}
            >
              {cat.icon} {cat.name}
            </Badge>
          );
        })}
      </div>
      <div className="skill-row-agents">
        {row.cells.map((cell) => (
          <AgentIcon key={cell.agentId} agentId={cell.agentId} status={cell.displayStatus} size={16} />
        ))}
      </div>
      <button
        className={"btn-row-sync" + (isSyncing ? " syncing" : "")}
        onClick={onSync}
        disabled={isSyncing || !row.canSync}
        title="同步到 Agent"
      >
        <RefreshCw size={13} />
      </button>
      <div className="skill-row-arrow">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}
