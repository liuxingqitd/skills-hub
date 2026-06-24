"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

import type { InstructionsPageModel } from "@/src/types/instructions";
import type { InstructionPathSettings } from "@/src/lib/config/settings-store";
import { useToast } from "@/src/components/ui/toast";
import {
  loadInstructionPaths,
  loadInstructionsModel,
  saveInstructionAsset,
  saveInstructionPaths,
  selectInstructionFile,
} from "@/src/lib/instructions/instructions-client";
import type { InstructionAsset } from "@/src/types/instructions";

type EditorViewMode = "edit" | "preview" | "split";

function pickDefaultAssetId(assets: InstructionAsset[], current: string | null) {
  if (current && assets.some((asset) => asset.id === current && asset.exists && asset.isEditable)) {
    return current;
  }
  return assets.find((asset) => asset.exists && asset.isEditable)?.id ?? assets[0]?.id ?? null;
}

/* ============================================================
   Editor Page
   ============================================================ */

export function EditorPage() {
  const { addToast } = useToast();

  const [model, setModel] = useState<InstructionsPageModel | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pathDraft, setPathDraft] = useState("");
  const [instructionPaths, setInstructionPaths] = useState<InstructionPathSettings>({});
  const [editorView, setEditorView] = useState<EditorViewMode>("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

  const loadInstructions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [data, paths] = await Promise.all([
        loadInstructionsModel(),
        loadInstructionPaths(),
      ]);
      setModel(data);
      setInstructionPaths(paths);
      setSelectedAssetId((current) => pickDefaultAssetId(data.assets, current));
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

  useEffect(() => {
    setPathDraft(selected?.path ?? "");
    setPathError(null);
  }, [selected?.id, selected?.path]);

  async function handleSave(): Promise<boolean> {
    if (!selected?.exists || !canSave) return false;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveInstructionAsset({
        path: selected.path,
        content: draft,
        previousHash: selected.contentHash,
      });
      await loadInstructions();
      addToast(`${selected.title} 已保存`);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function applyInstructionPath(path: string | null) {
    if (!selected) return;
    setIsSavingPath(true);
    setPathError(null);
    try {
      const nextPaths = { ...instructionPaths };
      if (path && path.trim()) {
        nextPaths[selected.agent] = path.trim();
      } else {
        delete nextPaths[selected.agent];
      }
      const savedPaths = await saveInstructionPaths(nextPaths);
      setInstructionPaths(savedPaths);
      await loadInstructions();
      addToast(path ? "规则文件路径已更新" : "规则文件路径已重置");
    } catch (err) {
      setPathError(err instanceof Error ? err.message : "路径保存失败");
    } finally {
      setIsSavingPath(false);
    }
  }

  async function handlePickInstructionFile() {
    try {
      const path = await selectInstructionFile();
      setPathDraft(path);
      await applyInstructionPath(path);
    } catch {
      setPathError("无法打开文件选择器，请手动输入路径");
    }
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
            onClick={handleSave}
            disabled={!canSave}
          >
            <Save size={14} /> 保存
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
              <PathControls
                pathDraft={pathDraft}
                isSavingPath={isSavingPath}
                pathError={pathError}
                onPathDraftChange={setPathDraft}
                onApply={() => applyInstructionPath(pathDraft)}
                onPick={handlePickInstructionFile}
                onReset={() => applyInstructionPath(null)}
              />
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
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {draft || "暂无内容"}
                  </pre>
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
            <>
              {selected && (
                <PathControls
                  pathDraft={pathDraft}
                  isSavingPath={isSavingPath}
                  pathError={pathError}
                  onPathDraftChange={setPathDraft}
                  onApply={() => applyInstructionPath(pathDraft)}
                  onPick={handlePickInstructionFile}
                  onReset={() => applyInstructionPath(null)}
                />
              )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type PathControlsProps = {
  pathDraft: string;
  isSavingPath: boolean;
  pathError: string | null;
  onPathDraftChange: (value: string) => void;
  onApply: () => void;
  onPick: () => void;
  onReset: () => void;
};

function PathControls({
  pathDraft,
  isSavingPath,
  pathError,
  onPathDraftChange,
  onApply,
  onPick,
  onReset,
}: PathControlsProps) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={pathDraft}
          onChange={(event) => onPathDraftChange(event.target.value)}
          placeholder="全局规则文件路径"
          style={{
            flex: 1,
            minWidth: 0,
            height: 32,
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--bg)",
            color: "var(--text)",
            padding: "0 10px",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        />
        <button className="btn btn-ghost btn-sm" onClick={onPick} disabled={isSavingPath}>
          选择文件
        </button>
        <button className="btn btn-primary btn-sm" onClick={onApply} disabled={isSavingPath}>
          {isSavingPath ? "应用中……" : "应用路径"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onReset} disabled={isSavingPath}>
          重置
        </button>
      </div>
      {pathError && (
        <div style={{ color: "var(--error)", fontSize: 12 }}>
          {pathError}
        </div>
      )}
    </div>
  );
}
