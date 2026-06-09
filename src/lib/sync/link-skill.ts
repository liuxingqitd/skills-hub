import { cp, mkdir, rename, rm, symlink } from "node:fs/promises";
import { dirname } from "node:path";

import type { SyncMode } from "@/src/lib/config/settings-store";

export async function deploySkill(
  sourcePath: string,
  targetPath: string,
  mode: SyncMode
): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });

  if (mode === "symlink") {
    await rm(targetPath, { recursive: true, force: true });
    await symlink(sourcePath, targetPath, "dir");
  } else {
    await cp(sourcePath, targetPath, { recursive: true });
  }
}

export async function repairSkill(
  sourcePath: string,
  targetPath: string,
  mode: SyncMode
): Promise<void> {
  if (mode === "symlink") {
    await rm(targetPath, { recursive: true, force: true });
    await mkdir(dirname(targetPath), { recursive: true });
    await symlink(sourcePath, targetPath, "dir");
  } else {
    const tmpTarget = targetPath + ".tmp-" + Date.now();
    await cp(sourcePath, tmpTarget, { recursive: true });
    await rm(targetPath, { recursive: true, force: true });
    await rename(tmpTarget, targetPath);
  }
}
