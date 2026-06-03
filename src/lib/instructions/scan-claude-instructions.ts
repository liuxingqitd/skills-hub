import { homedir } from "node:os";
import { join } from "node:path";

import { scanAgentInstructions } from "@/src/lib/instructions/scan-agent-instructions";
import type { InstructionSurface } from "@/src/types/instructions";

export async function scanClaudeInstructions(
  claudeRootDir: string = join(homedir(), ".claude")
): Promise<InstructionSurface> {
  return scanAgentInstructions("claude", claudeRootDir, {
    mainFileName: "CLAUDE.md",
    idPrefix: "claude",
    title: "~/.claude/CLAUDE.md",
    description: "Claude Code 的用户级全局指令文件。",
    loadBehavior: "对这台机器上的所有 Claude Code 项目生效，适合放个人级偏好和长期工作流。"
  });
}
