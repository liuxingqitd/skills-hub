import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";

import { NextResponse } from "next/server";
import { z } from "zod";

import { expandAgentPath } from "@/src/lib/config/load-agents";
import { discoverSkillDirs } from "@/src/lib/skills/discover-skill-dirs";
import type { AgentPathValidation } from "@/src/types/agents";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const requestSchema = z.object({
  path: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const inputPath = parsed.data.path;
  const resolvedPath = expandAgentPath(inputPath);

  try {
    const pathStat = await stat(resolvedPath);
    if (!pathStat.isDirectory()) {
      return NextResponse.json(
        pathValidation(inputPath, resolvedPath, "not-directory", 0),
        { headers: NO_STORE_HEADERS }
      );
    }
    await access(resolvedPath, constants.R_OK);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === "EACCES" || code === "EPERM" ? "no-access" : "missing";
    return NextResponse.json(
      pathValidation(inputPath, resolvedPath, status, 0),
      { headers: NO_STORE_HEADERS }
    );
  }

  const skills = await discoverSkillDirs(resolvedPath);
  return NextResponse.json(
    pathValidation(
      inputPath,
      resolvedPath,
      skills.length > 0 ? "ok" : "empty",
      skills.length
    ),
    { headers: NO_STORE_HEADERS }
  );
}

function pathValidation(
  inputPath: string,
  resolvedPath: string,
  status: AgentPathValidation["status"],
  skillCount: number
): AgentPathValidation {
  const messages: Record<AgentPathValidation["status"], string> = {
    ok: `已找到 ${skillCount} 个 Skill`,
    missing: "路径不存在",
    "not-directory": "该路径不是文件夹",
    "no-access": "没有读取权限",
    empty: "未发现 Skill",
  };

  return {
    inputPath,
    resolvedPath,
    status,
    skillCount,
    message: messages[status],
  };
}
