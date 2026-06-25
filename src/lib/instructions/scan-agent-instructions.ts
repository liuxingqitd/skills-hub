import { basename, dirname } from "node:path";

import { hashInstructionContent } from "@/src/lib/instructions/hash-instruction-content";
import { readPreview } from "@/src/lib/instructions/read-preview";
import type { InstructionAgent, InstructionAsset, InstructionSurface } from "@/src/types/instructions";

interface ScanAgentConfig {
  mainFileName: string;
  idPrefix: string;
  title: string;
  description: string;
  loadBehavior: string;
}

export async function scanAgentInstructions(
  agent: InstructionAgent,
  rootDir: string,
  rootFile: string,
  config: ScanAgentConfig
): Promise<InstructionSurface> {
  const rootContent = await readPreview(rootFile);

  const assets: InstructionAsset[] = [
    {
      id: `${config.idPrefix}:${config.mainFileName}`,
      agent,
      kind: "main",
      scope: "user",
      status: rootContent !== null ? "found" : "missing",
      path: rootFile,
      exists: rootContent !== null,
      title: config.title,
      description: config.description,
      loadBehavior: config.loadBehavior,
      priority: 0,
      parentPath: null,
      contentPreview: rootContent,
      contentHash: rootContent !== null ? hashInstructionContent(rootContent) : null,
      isEditable: rootContent !== null,
      canCreate: false
    }
  ];

  return {
    agent,
    rootPath: rootDir,
    assets,
    summary: {
      mainFiles: assets.filter((asset) => asset.kind === "main" && asset.exists).length,
      ruleFiles: 0,
      nestedFiles: 0,
      recommendedMissingFiles: assets.filter((asset) => !asset.exists).length
    }
  };
}

export async function scanConfiguredAgentInstructions(
  agent: InstructionAgent,
  agentName: string,
  instructionPath: string | undefined
): Promise<InstructionSurface> {
  if (!instructionPath) {
    const asset: InstructionAsset = {
      id: `${agent}:configured`,
      agent,
      kind: "main",
      scope: "user",
      status: "missing",
      path: "",
      exists: false,
      title: `${agentName} 全局规则`,
      description: `${agentName} 的用户级全局规则文件。`,
      loadBehavior: "选择一个 Markdown 文件后，Skills Hub 会把它作为该 agent 的全局规则入口。",
      priority: 0,
      parentPath: null,
      contentPreview: null,
      contentHash: null,
      isEditable: false,
      canCreate: false,
    };

    return {
      agent,
      rootPath: "",
      assets: [asset],
      summary: {
        mainFiles: 0,
        ruleFiles: 0,
        nestedFiles: 0,
        recommendedMissingFiles: 1,
      },
    };
  }

  return scanAgentInstructions(
    agent,
    rootDirForConfiguredPath(instructionPath),
    instructionPath,
    {
      mainFileName: fileNameForConfiguredPath(instructionPath),
      idPrefix: agent,
      title: `${agentName} 全局规则`,
      description: `${agentName} 的用户级全局规则文件。`,
      loadBehavior: "使用你手动配置的路径，对该 agent 的本机工作区提供默认行为约束。",
    }
  );
}

function rootDirForConfiguredPath(path: string) {
  return dirname(path);
}

function fileNameForConfiguredPath(path: string) {
  return basename(path) || "AGENTS.md";
}
