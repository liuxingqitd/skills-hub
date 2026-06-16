import { rm, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { deploySkill, repairSkill } from "@/src/lib/sync/link-skill";
import type { SyncMode } from "@/src/lib/config/settings-store";
import type { SyncExecutionResult, SyncPlan } from "@/src/types/sync";

type ApplyOptions = {
  syncMode?: SyncMode;
  pruneOrphans?: boolean;
  allowedSourceRoots?: string[];
  canonicalSourceRoot?: string;
};

function isSourceAllowed(sourcePath: string, allowedRoots: string[]): boolean {
  const resolvedSource = resolve(sourcePath);
  return allowedRoots.some((root) => {
    const resolvedRoot = resolve(root);
    return resolvedSource === resolvedRoot || resolvedSource.startsWith(resolvedRoot + sep);
  });
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function applySyncPlan(
  plan: SyncPlan,
  options: ApplyOptions = {}
): Promise<SyncExecutionResult> {
  const mode = options.syncMode ?? "copy";
  const result: SyncExecutionResult = {
    completed: [],
    skipped: [],
    failed: []
  };

  for (const action of plan.actions) {
    try {
      if (action.type === "skip_conflict") {
        result.skipped.push(action);
        continue;
      }

      if (action.type === "remove_orphan" && !options.pruneOrphans) {
        result.skipped.push(action);
        continue;
      }

      if (action.type === "remove_orphan") {
        await rm(action.targetPath, { recursive: true, force: true });
        result.completed.push(action);
        continue;
      }

      let sourcePath = action.sourcePath;
      if (!sourcePath) {
        throw new Error("Missing source path for sync action.");
      }

      if (
        options.canonicalSourceRoot &&
        options.allowedSourceRoots &&
        options.allowedSourceRoots.length > 0 &&
        !isSourceAllowed(sourcePath, options.allowedSourceRoots)
      ) {
        const canonicalPath = join(options.canonicalSourceRoot, action.skillName);
        if (!(await pathExists(canonicalPath))) {
          await deploySkill(sourcePath, canonicalPath, mode);
        }
        sourcePath = canonicalPath;
      }

      if (
        options.allowedSourceRoots &&
        options.allowedSourceRoots.length > 0 &&
        !isSourceAllowed(sourcePath, options.allowedSourceRoots)
      ) {
        throw new Error(`Source path is outside all managed agent directories: ${sourcePath}`);
      }

      if (action.type === "repair_copy") {
        await repairSkill(sourcePath, action.targetPath, mode);
      } else {
        await deploySkill(sourcePath, action.targetPath, mode);
      }
      result.completed.push(action);
    } catch (error) {
      result.failed.push({
        ...action,
        error: error instanceof Error ? error.message : "Unknown sync error"
      });
    }
  }

  return result;
}
