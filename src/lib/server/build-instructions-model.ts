import { homedir } from "node:os";
import { join } from "node:path";

import { loadAgents } from "@/src/lib/config/load-agents";
import { readSettings } from "@/src/lib/config/settings-store";
import { resolveInstructionPaths } from "@/src/lib/instructions/instruction-paths";
import { scanConfiguredAgentInstructions } from "@/src/lib/instructions/scan-agent-instructions";
import { scanClaudeInstructions } from "@/src/lib/instructions/scan-claude-instructions";
import { scanCodexInstructions } from "@/src/lib/instructions/scan-codex-instructions";
import { scanHermesInstructions } from "@/src/lib/instructions/scan-hermes-instructions";
import type { InstructionAsset, InstructionsPageModel } from "@/src/types/instructions";

export async function buildInstructionsModel(
  claudeRootDir: string = join(homedir(), ".claude"),
  codexRootDir: string = process.env.CODEX_HOME || join(homedir(), ".codex")
): Promise<InstructionsPageModel> {
  const [settings, agents] = await Promise.all([readSettings(), loadAgents()]);
  const paths = resolveInstructionPaths(settings.instructionPaths, {
    claudeRootDir,
    codexRootDir,
  });
  const builtinScanners = {
    claude: () => scanClaudeInstructions(claudeRootDir, paths.claudePath),
    codex: () => scanCodexInstructions(codexRootDir, paths.codexPath),
    hermes: () => scanHermesInstructions(undefined, paths.hermesPath),
  };
  const knownAgentIds = new Set(["claude", "codex", "hermes"]);
  for (const agent of agents) {
    knownAgentIds.add(agent.id);
  }
  for (const agentId of Object.keys(settings.instructionPaths)) {
    knownAgentIds.add(agentId);
  }

  const surfaces = await Promise.all(
    [...knownAgentIds].sort().map((agentId) => {
      const agent = agents.find((item) => item.id === agentId);
      const scanner = builtinScanners[agentId as keyof typeof builtinScanners];
      if (scanner) return scanner();
      return scanConfiguredAgentInstructions(
        agentId,
        agent?.name ?? agentId,
        paths.pathsByAgent[agentId]
      );
    })
  );

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
