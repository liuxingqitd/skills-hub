import { homedir } from "node:os";
import { join } from "node:path";

import { scanClaudeInstructions } from "@/src/lib/instructions/scan-claude-instructions";
import { scanCodexInstructions } from "@/src/lib/instructions/scan-codex-instructions";
import { scanHermesInstructions } from "@/src/lib/instructions/scan-hermes-instructions";
import type { InstructionAsset, InstructionsPageModel } from "@/src/types/instructions";

export async function buildInstructionsModel(
  claudeRootDir: string = join(homedir(), ".claude"),
  codexRootDir: string = process.env.CODEX_HOME || join(homedir(), ".codex")
): Promise<InstructionsPageModel> {
  const surfaces = await Promise.all([
    scanClaudeInstructions(claudeRootDir),
    scanCodexInstructions(codexRootDir),
    scanHermesInstructions()
  ]);

  const assets = surfaces
    .flatMap((surface) => surface.assets)
    .sort((left: InstructionAsset, right: InstructionAsset) => {
      if (left.agent !== right.agent) {
        return left.agent.localeCompare(right.agent);
      }
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.path.localeCompare(right.path);
    });

  return {
    surfaces,
    assets
  };
}
