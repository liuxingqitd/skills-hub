"use client";

import { useI18n } from "@/src/lib/i18n";

export default function InstructionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="main">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">{t("editor.title")}</span>
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
          <h1 style={{ margin: 0, fontSize: 18 }}>{t("editor.errorTitle")}</h1>
          <p style={{ margin: 0, color: "var(--muted2)", fontSize: 13 }}>
            {t("editor.errorDesc")}
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
            {t("editor.reload")}
          </button>
        </div>
      </div>
    </div>
  );
}
