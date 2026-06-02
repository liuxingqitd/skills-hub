"use client";

import type { BoardDisplayStatus } from "@/src/types/board";

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
};

const statusLabels: Record<BoardDisplayStatus, string> = {
  installed: "已安装",
  missing: "缺失",
  broken: "异常",
};

export function AgentIcon({ agentId, status, size = 16 }: Props) {
  const src = agentIcons[agentId];

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
