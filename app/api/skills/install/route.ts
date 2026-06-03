import { NextResponse } from "next/server";

import { loadAgents } from "@/src/lib/config/load-agents";
import { installSkillSource } from "@/src/lib/skills/install-skill-source";

const MAX_SOURCE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 30_000;
// single-user local deployment — simple rate limit against accidental double-clicks
let lastInstallTime = 0;

function isRateLimited(now: number): boolean {
  return now - lastInstallTime < RATE_LIMIT_WINDOW_MS;
}

export async function POST(request: Request) {
  if (isRateLimited(Date.now())) {
    return NextResponse.json(
      { error: "操作过于频繁，请等待 30 秒后再试。" },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const source = typeof payload?.source === "string" ? payload.source : "";

  if (!source.trim()) {
    return NextResponse.json(
      { error: "请输入 GitHub skill 项目地址或本地目录。" },
      { status: 400 }
    );
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    return NextResponse.json(
      { error: `项目地址或路径过长，请限制在 ${MAX_SOURCE_LENGTH} 个字符以内。` },
      { status: 400 }
    );
  }

  lastInstallTime = Date.now();

  try {
    const agents = await loadAgents();
    const result = await installSkillSource(source, agents);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "安装失败。" },
      { status: 400 }
    );
  }
}
