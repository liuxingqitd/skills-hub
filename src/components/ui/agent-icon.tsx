"use client";

import type { BoardDisplayStatus } from "@/src/types/board";
import { useI18n } from "@/src/lib/i18n";

type Props = {
  agentId: string;
  status: BoardDisplayStatus;
  size?: number;
};

const agentIcons: Record<string, string> = {
  claude: "/icons/claude.svg",
  codex: "/icons/codex.svg",
  cursor: "/icons/cursor.svg",
  trae: "/icons/trae.svg",
  hermes: "/icons/hermes.svg",
  codebuddy: "/icons/codebuddy.svg",
  antigravity: "/icons/antigravity.svg",
  opencode: "/icons/opencode.svg",
};

export function AgentIcon({ agentId, status, size = 16 }: Props) {
  const { t } = useI18n();
  const src = agentIcons[agentId];
  const statusLabels: Record<BoardDisplayStatus, string> = {
    installed: t("common.installed"),
    missing: t("common.missing"),
    broken: t("common.error"),
  };

  return (
    <span
      className={`agent-icon agent-icon--${status}`}
      title={`${agentId} - ${statusLabels[status]}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 4,
        height: size + 4,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={agentId}
          width={size}
          height={size}
          className="agent-icon-img"
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--muted2)",
            fontSize: Math.round(size * 0.6),
            lineHeight: `${size}px`,
            textAlign: "center",
            color: "#fff",
            fontWeight: 700,
            display: "block",
          }}
        >
          {agentId.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
