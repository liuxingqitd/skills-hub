import { homedir } from "node:os";
import { join, relative } from "node:path";

import { hashInstructionContent } from "@/src/lib/instructions/hash-instruction-content";
import { rootDirForInstructionPath } from "@/src/lib/instructions/instruction-paths";
import { readPreview } from "@/src/lib/instructions/read-preview";
import type { InstructionAsset, InstructionSurface } from "@/src/types/instructions";

function buildId(rootPath: string, path: string) {
  return `hermes:${relative(rootPath, path) || "root"}`;
}

function resolveHermesHome(): string {
  if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return join(process.env.LOCALAPPDATA, "hermes");
  }
  return join(homedir(), ".hermes");
}

export async function scanHermesInstructions(
  hermesRootDir: string = resolveHermesHome(),
  instructionPath: string = join(hermesRootDir, "AGENTS.md")
): Promise<InstructionSurface> {
  const resolvedRootDir = rootDirForInstructionPath(instructionPath);
  const rootMain = instructionPath;
  const rootMainContent = await readPreview(rootMain);

  const assets: InstructionAsset[] = [
    {
      id: buildId(resolvedRootDir, rootMain),
      agent: "hermes",
      kind: "main",
      scope: "user",
      status: rootMainContent !== null ? "found" : "missing",
      path: rootMain,
      exists: rootMainContent !== null,
      title: "~/.hermes/AGENTS.md",
      description: "Hermes Agent 的用户级全局指令文件。",
      loadBehavior: "作为 Hermes 的用户级基础说明，对所有 Hermes 工作区提供默认行为约束。",
      priority: 0,
      parentPath: null,
      contentPreview: rootMainContent,
      contentHash: rootMainContent !== null ? hashInstructionContent(rootMainContent) : null,
      isEditable: rootMainContent !== null,
      canCreate: false
    }
  ];

  return {
    agent: "hermes",
    rootPath: resolvedRootDir,
    assets,
    summary: {
      mainFiles: assets.filter((asset) => asset.kind === "main" && asset.exists).length,
      ruleFiles: 0,
      nestedFiles: 0,
      recommendedMissingFiles: assets.filter((asset) => !asset.exists).length
    }
  };
}
