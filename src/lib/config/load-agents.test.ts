import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadAgents,
  loadAllRegistryAgents,
  resolveActiveAgentIds,
} from "@/src/lib/config/load-agents";
import type { AgentDefinition } from "@/src/types/agents";

const tempDirs: string[] = [];
const agentsConfigPath = resolve(process.cwd(), "config", "agents.json");

async function makeTempRoot(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function makeSkill(root: string, name: string) {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), "# skill\n");
}

function makeAgent(id: string, skillsPath: string): AgentDefinition {
  return {
    id,
    name: id,
    skillsPath,
    description: "",
    homepage: "",
    enabled: false,
  };
}

describe("loadAgents", () => {
  let originalAgentsConfig: string | null | undefined;

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
    if (originalAgentsConfig !== undefined) {
      if (originalAgentsConfig === null) {
        await rm(agentsConfigPath, { force: true });
      } else {
        await writeFile(agentsConfigPath, originalAgentsConfig, "utf-8");
      }
      originalAgentsConfig = undefined;
    }
  });

  it("loads enabled agent definitions", async () => {
    const agents = await loadAgents();

    expect(agents.length).toBeGreaterThan(0);
    expect(agents.some((agent) => agent.id === "claude")).toBe(true);
  });

  it("includes locally detected agents before the user customizes agent selection", async () => {
    const claudeRoot = await makeTempRoot("load-agents-claude-");
    const cursorRoot = await makeTempRoot("load-agents-cursor-");
    await makeSkill(cursorRoot, "cursor-only");

    const activeIds = await resolveActiveAgentIds(
      [makeAgent("claude", claudeRoot), makeAgent("cursor", cursorRoot)],
      { enabledIds: ["claude"], customized: false }
    );

    expect([...activeIds].sort()).toEqual(["claude", "cursor"]);
  });

  it("respects explicit user selection after customization", async () => {
    const claudeRoot = await makeTempRoot("load-agents-custom-claude-");
    const cursorRoot = await makeTempRoot("load-agents-custom-cursor-");
    await makeSkill(cursorRoot, "cursor-only");

    const activeIds = await resolveActiveAgentIds(
      [makeAgent("claude", claudeRoot), makeAgent("cursor", cursorRoot)],
      { enabledIds: ["claude"], customized: true }
    );

    expect([...activeIds]).toEqual(["claude"]);
  });

  it("does not auto-enable detected agents when the legacy config file has enabledIds", async () => {
    originalAgentsConfig = await readFile(agentsConfigPath, "utf-8").catch(() => null);

    await writeFile(
      agentsConfigPath,
      JSON.stringify({ enabledIds: ["claude"] }, null, 2),
      "utf-8"
    );

    const agents = await loadAllRegistryAgents();
    const enabledIds = agents.filter((agent) => agent.enabled).map((agent) => agent.id);

    expect(enabledIds).toEqual(["claude"]);
  });
});
