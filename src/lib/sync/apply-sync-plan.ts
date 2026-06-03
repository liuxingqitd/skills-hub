import { cp, mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import type { SyncExecutionResult, SyncPlan } from "@/src/types/sync";

type ApplyOptions = {
  pruneOrphans?: boolean;
  allowedSourceRoots?: string[];
};

async function copySkill(sourcePath: string, targetPath: string) {
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
}

function isSourceAllowed(sourcePath: string, allowedRoots: string[]): boolean {
  const resolvedSource = resolve(sourcePath);
  return allowedRoots.some((root) => {
    const resolvedRoot = resolve(root);
    return resolvedSource === resolvedRoot || resolvedSource.startsWith(resolvedRoot + sep);
  });
}

export async function applySyncPlan(
  plan: SyncPlan,
  options: ApplyOptions = {}
): Promise<SyncExecutionResult> {
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

      if (!action.sourcePath) {
        throw new Error("Missing source path for sync action.");
      }

      // 安全检查：sourcePath 必须在某个已知 agent 目录下
      if (
        options.allowedSourceRoots &&
        options.allowedSourceRoots.length > 0 &&
        !isSourceAllowed(action.sourcePath, options.allowedSourceRoots)
      ) {
        throw new Error(`Source path is outside all managed agent directories: ${action.sourcePath}`);
      }

      // 先复制到临时目录，再原子替换目标，避免 cp 失败时已删除原目录导致数据丢失
      const tmpTarget = action.targetPath + ".tmp-" + Date.now();
      await copySkill(action.sourcePath, tmpTarget);
      await rm(action.targetPath, { recursive: true, force: true });
      await rename(tmpTarget, action.targetPath);
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
