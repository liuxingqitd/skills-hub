import { homedir } from "node:os";
import { join } from "node:path";

import {
  fileNameForInstructionPath,
  rootDirForInstructionPath,
} from "@/src/lib/instructions/instruction-paths";
import { scanAgentInstructions } from "@/src/lib/instructions/scan-agent-instructions";
import type { InstructionSurface } from "@/src/types/instructions";

export async function scanCodexInstructions(
  codexRootDir: string = process.env.CODEX_HOME || join(homedir(), ".codex"),
  instructionPath: string = join(codexRootDir, "AGENTS.md")
): Promise<InstructionSurface> {
  return scanAgentInstructions("codex", rootDirForInstructionPath(instructionPath), instructionPath, {
    mainFileName: fileNameForInstructionPath(instructionPath),
    idPrefix: "codex",
    title: "~/.codex/AGENTS.md",
    description: "Codex 的全局 AGENTS 指令文件。",
    loadBehavior: "作为 Codex 的用户级基础说明，对本机上的 Codex 工作区提供默认行为约束。"
  });
}
