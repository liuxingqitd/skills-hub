import { join } from "node:path";

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
  config: ScanAgentConfig
): Promise<InstructionSurface> {
  const rootFile = join(rootDir, config.mainFileName);
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
      isEditable: true,
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
