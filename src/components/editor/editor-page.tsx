"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { InstructionAsset, InstructionsPageModel } from "@/src/types/instructions";
import { useToast } from "@/src/components/ui/toast";

type EditorViewMode = "edit" | "preview" | "split";

const agentLabels: Record<string, string> = {
  claude: "Claude",
  codex: "Codex",
  hermes: "Hermes",
};

/* ============================================================
   Editor Page
   ============================================================ */

export function EditorPage() {
  const { addToast } = useToast();

  const [model, setModel] = useState<InstructionsPageModel | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editorView, setEditorView] = useState<EditorViewMode>("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadInstructions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/instructions", { cache: "no-store" });
      if (!res.ok) throw new Error(`加载失败：${res.status}`);
      const data = (await res.json()) as InstructionsPageModel;
      setModel(data);
      if (data.assets.length > 0) {
        setSelectedAssetId((current) =>
          current && data.assets.some((a) => a.id === current) ? current : data.assets[0].id
        );
      }
      return data;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "加载失败");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstructions();
  }, [loadInstructions]);

  const assets = model?.assets ?? [];
  const selected = assets.find((a) => a.id === selectedAssetId) ?? assets[0] ?? null;
  const baseContent = selected?.contentPreview ?? "";
  const hasUnsavedChanges = selected?.exists ? draft !== baseContent : false;
  const canSave = Boolean(selected?.exists) && hasUnsavedChanges && !isSaving;

  useEffect(() => {
    setDraft(baseContent);
    setSaveError(null);
  }, [baseContent, selected?.id]);

  async function handleSave() {
    if (!selected?.exists || !canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/instructions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selected.path,
          content: draft,
          previousHash: selected.contentHash,
        }),
      });
      const result = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || result.ok === false) {
        throw new Error(result.error || `保存失败：${res.status}`);
      }
      await loadInstructions();
      addToast(`${selected.title} 已保存`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAll() {
    if (isSaving) return;
    // Save current file first
    if (canSave) {
      await handleSave();
    }
    addToast("全部文件已保存");
  }

  // Cmd+S
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lineCount = draft.split("\n").length;

  return (
    <div className="main">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <Link href="/" className="btn-back">
            <ArrowLeft size={16} /> 返回
          </Link>
          <span className="topbar-title">全局规则编辑器</span>
        </div>
        <div className="topbar-right">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSaveAll}
            disabled={isSaving || !assets.some((a) => a.exists)}
          >
            <Save size={14} /> 全部保存
          </button>
        </div>
      </div>

      {/* Editor layout */}
      <div className="editor-layout">
        {/* File panel */}
        <div className="file-panel">
          <div className="file-panel-header">规则文件</div>
          {isLoading ? (
            <div style={{ padding: "20px 12px", color: "var(--muted2)", fontSize: 13, textAlign: "center" }}>
              加载中……
            </div>
          ) : loadError ? (
            <div style={{ padding: "20px 12px", color: "var(--error)", fontSize: 13, textAlign: "center" }}>
              {loadError}
            </div>
          ) : assets.length === 0 ? (
            <div style={{ padding: "20px 12px", color: "var(--muted2)", fontSize: 13, textAlign: "center" }}>
              没有可编辑的文件
            </div>
          ) : (
            assets.map((asset) => {
              const isActive = selected?.id === asset.id;
              const isDirty = isActive ? hasUnsavedChanges : false;
              return (
                <div
                  key={asset.id}
                  className={"file-item" + (isActive ? " active" : "")}
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <FileText size={16} />
                  <span>{asset.title}</span>
                  {isDirty && <span style={{ color: "var(--warn)", fontSize: 10 }}>●</span>}
                  <span className="file-item-meta">
                    {asset.exists ? `${asset.contentPreview?.split("\n").length ?? 0} 行` : "缺失"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Code editor */}
        <div className="editor-panel">
          {selected?.exists ? (
            <>
              <div className="editor-toolbar">
                <div className="editor-file-name">{selected.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={"editor-status" + (hasUnsavedChanges ? " modified" : " saved")}>
                    {hasUnsavedChanges ? "● 未保存" : "✓ 已保存"}
                  </span>
                  <span className="editor-status" style={{ color: "var(--muted2)" }}>
                    {lineCount} 行
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={!canSave}
                  >
                    {isSaving ? (
                      <LoaderCircle size={12} className="spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    {isSaving ? "保存中……" : "保存"}
                  </button>
                </div>
              </div>
              {editorView !== "preview" && (
                <div className="editor-body">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="在此编辑文件内容……"
                    spellCheck={false}
                  />
                </div>
              )}
              {editorView === "preview" && (
                <div
                  className="editor-body"
                  style={{ padding: 20, overflow: "auto" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {draft || "_暂无内容_"}
                  </ReactMarkdown>
                </div>
              )}
              {saveError && (
                <div
                  style={{
                    padding: "8px 16px",
                    color: "var(--error)",
                    fontSize: 12,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {saveError}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted2)",
                fontSize: 14,
              }}
            >
              {loadError ? loadError : "没有可编辑的文件"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
