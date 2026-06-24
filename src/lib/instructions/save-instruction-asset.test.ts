import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { hashInstructionContent } from "@/src/lib/instructions/hash-instruction-content";
import {
  updateInstructionAsset
} from "@/src/lib/instructions/save-instruction-asset";

const tempDirs: string[] = [];

async function createRoots() {
  const root = await mkdtemp(join(tmpdir(), "instruction-save-"));
  tempDirs.push(root);

  const claudeRootDir = join(root, ".claude");
  const codexRootDir = join(root, ".codex");
  await mkdir(join(claudeRootDir, "rules"), { recursive: true });
  await mkdir(codexRootDir, { recursive: true });

  return { claudeRootDir, codexRootDir };
}

describe("instruction writes", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) =>
        import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }))
      )
    );
  });

  it("updates the Claude global instruction file", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(claudeRootDir, "CLAUDE.md");
    await writeFile(targetPath, "# Old", "utf8");

    const result = await updateInstructionAsset(
      {
        path: targetPath,
        content: "# New",
        previousHash: hashInstructionContent("# Old")
      },
      { claudeRootDir, codexRootDir }
    );

    expect(result.contentHash).toBe(hashInstructionContent("# New"));
  });

  it("updates the Codex global instruction file", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(codexRootDir, "AGENTS.md");
    await writeFile(targetPath, "# Old", "utf8");

    const result = await updateInstructionAsset(
      {
        path: targetPath,
        content: "# New",
        previousHash: hashInstructionContent("# Old")
      },
      { claudeRootDir, codexRootDir }
    );

    expect(result.contentHash).toBe(hashInstructionContent("# New"));
  });

  it("updates a configured custom Codex instruction file", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(codexRootDir, "rules", "codex-global.md");
    await mkdir(join(codexRootDir, "rules"), { recursive: true });
    await writeFile(targetPath, "# Old", "utf8");

    const result = await updateInstructionAsset(
      {
        path: targetPath,
        content: "# New",
        previousHash: hashInstructionContent("# Old")
      },
      {
        claudeRootDir,
        codexRootDir,
        instructionPaths: { codex: targetPath },
      }
    );

    expect(result.path).toBe(targetPath);
    expect(result.contentHash).toBe(hashInstructionContent("# New"));
  });

  it("rejects the default Codex file after a custom path is configured", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const defaultPath = join(codexRootDir, "AGENTS.md");
    const customPath = join(codexRootDir, "rules", "codex-global.md");
    await mkdir(join(codexRootDir, "rules"), { recursive: true });
    await writeFile(defaultPath, "# Default", "utf8");
    await writeFile(customPath, "# Custom", "utf8");

    await expect(
      updateInstructionAsset(
        {
          path: defaultPath,
          content: "# New",
          previousHash: hashInstructionContent("# Default")
        },
        {
          claudeRootDir,
          codexRootDir,
          instructionPaths: { codex: customPath },
        }
      )
    ).rejects.toMatchObject({ code: "INVALID_PATH" });
  });

  it("updates an existing file when the hash matches", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(claudeRootDir, "CLAUDE.md");
    await writeFile(targetPath, "# Old", "utf8");

    const result = await updateInstructionAsset(
      {
        path: targetPath,
        content: "# New",
        previousHash: hashInstructionContent("# Old")
      },
      { claudeRootDir, codexRootDir }
    );

    expect(result.contentHash).toBe(hashInstructionContent("# New"));
  });

  it("rejects updates to Claude rules files", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(claudeRootDir, "rules", "testing.md");
    await writeFile(targetPath, "# Rule", "utf8");

    await expect(
      updateInstructionAsset(
        {
          path: targetPath,
          content: "# New",
          previousHash: hashInstructionContent("# Rule")
        },
        { claudeRootDir, codexRootDir }
      )
    ).rejects.toMatchObject({ code: "INVALID_PATH" });
  });

  it("rejects updates to the Codex override file", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(codexRootDir, "AGENTS.override.md");
    await writeFile(targetPath, "# Override", "utf8");

    await expect(
      updateInstructionAsset(
        {
          path: targetPath,
          content: "# New",
          previousHash: hashInstructionContent("# Override")
        },
        { claudeRootDir, codexRootDir }
      )
    ).rejects.toMatchObject({ code: "INVALID_PATH" });
  });

  it("rejects stale updates", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();
    const targetPath = join(claudeRootDir, "CLAUDE.md");
    await writeFile(targetPath, "# Old", "utf8");

    await expect(
      updateInstructionAsset(
        {
          path: targetPath,
          content: "# New",
          previousHash: hashInstructionContent("# Different")
        },
        { claudeRootDir, codexRootDir }
      )
    ).rejects.toMatchObject({ code: "STALE_CONTENT" });
  });

  it("rejects updates for files that do not exist", async () => {
    const { claudeRootDir, codexRootDir } = await createRoots();

    await expect(
      updateInstructionAsset(
        {
          path: join(codexRootDir, "AGENTS.md"),
          content: "# Missing",
          previousHash: null
        },
        { claudeRootDir, codexRootDir }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
