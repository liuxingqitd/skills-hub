import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { scanAgentStates } from "@/src/lib/skills/scan-agent-skills";
import type { AgentDefinition } from "@/src/types/agents";
import type { SkillRecord } from "@/src/types/skills";

const tempDirs: string[] = [];

async function makeSkillDir(root: string, name: string) {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), "# skill\n");
}

describe("scanAgentStates", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) =>
        import("node:fs/promises").then(({ rm }) =>
          rm(dir, { recursive: true, force: true })
        )
      )
    );
  });

  it("does not surface .system as an orphaned skill", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "scan-agent-source-"));
    const agentRoot = await mkdtemp(join(tmpdir(), "scan-agent-target-"));
    tempDirs.push(sourceRoot, agentRoot);

    await makeSkillDir(sourceRoot, "frontend-design");
    await makeSkillDir(join(agentRoot, ".system"), "health");

    const skills: SkillRecord[] = [
      {
        name: "frontend-design",
        description: "Visible skill",
        sourcePath: join(sourceRoot, "frontend-design"),
        masterAgentId: "codex",
        skillFilePath: join(sourceRoot, "frontend-design", "SKILL.md"),
        hasSkillMd: true,
        updatedAt: new Date(0).toISOString(),
        isCustom: false
      }
    ];
    const agent: AgentDefinition = {
      id: "codex",
      name: "Codex",
      skillsPath: agentRoot,
      description: "",
      homepage: "",
      enabled: true
    };

    const states = await scanAgentStates(agent, skills);

    expect(states).toHaveLength(1);
    expect(states[0]?.skillName).toBe("frontend-design");
    expect(states[0]?.status).toBe("missing");
  });
});
