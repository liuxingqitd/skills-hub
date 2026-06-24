"use client";

export default function InstructionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="main">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">全局规则编辑器</span>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 520, display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>全局规则加载失败</h1>
          <p style={{ margin: 0, color: "var(--muted2)", fontSize: 13 }}>
            页面渲染时遇到异常，请重试。若问题持续出现，可以打开开发者控制台查看详细错误。
          </p>
          {error.message && (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                color: "var(--error)",
                fontSize: 12,
              }}
            >
              {error.message}
            </pre>
          )}
          <button className="btn btn-primary btn-sm" onClick={reset}>
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
}
