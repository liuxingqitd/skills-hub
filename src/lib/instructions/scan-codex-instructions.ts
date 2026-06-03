import { homedir } from "node:os";
import { join } from "node:path";

import { scanAgentInstructions } from "@/src/lib/instructions/scan-agent-instructions";
import type { InstructionSurface } from "@/src/types/instructions";

export async function scanCodexInstructions(
  codexRootDir: string = process.env.CODEX_HOME || join(homedir(), ".codex")
): Promise<InstructionSurface> {
  return scanAgentInstructions("codex", codexRootDir, {
    mainFileName: "AGENTS.md",
    idPrefix: "codex",
    title: `${codexRootDir}/AGENTS.md`,
    description: "Codex 的全局 AGENTS 指令文件。",
    loadBehavior: "作为 Codex 的用户级基础说明，对本机上的 Codex 工作区提供默认行为约束。"
  });
}
