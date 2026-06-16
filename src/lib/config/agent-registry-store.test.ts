import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const AGENTS_PATH = resolve(process.cwd(), "config", "agents.json");

async function readRawAgents() {
  try {
    return await readFile(AGENTS_PATH, "utf-8");
  } catch {
    return null;
  }
}

describe("agent-registry-store", () => {
  let originalContent: string | null = null;

  afterEach(async () => {
    if (originalContent === null) {
      await rm(AGENTS_PATH, { force: true });
    } else {
      await writeFile(AGENTS_PATH, originalContent, "utf-8");
    }
  });

  it("treats an existing legacy enabledIds file as explicit user selection", async () => {
    originalContent = await readRawAgents();
    await writeFile(
      AGENTS_PATH,
      JSON.stringify({ enabledIds: ["claude"] }, null, 2),
      "utf-8"
    );

    const { readAgentSelection } = await import("./agent-registry-store");

    await expect(readAgentSelection()).resolves.toEqual({
      enabledIds: ["claude"],
      customized: true,
    });
  });

  it("uses auto-detection mode only when the selection file is missing", async () => {
    originalContent = await readRawAgents();
    await rm(AGENTS_PATH, { force: true });

    const { readAgentSelection } = await import("./agent-registry-store");

    await expect(readAgentSelection()).resolves.toEqual({
      enabledIds: [],
      customized: false,
    });
  });
});
