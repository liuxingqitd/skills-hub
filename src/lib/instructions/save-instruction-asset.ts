import { lstat, mkdir, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, sep } from "node:path";

import { readSettings, type InstructionPathSettings } from "@/src/lib/config/settings-store";
import { hashInstructionContent } from "@/src/lib/instructions/hash-instruction-content";
import {
  agentForPath,
  resolveInstructionPaths,
} from "@/src/lib/instructions/instruction-paths";
import { readPreview } from "@/src/lib/instructions/read-preview";

export type InstructionWriteErrorCode =
  | "STALE_CONTENT"
  | "INVALID_PATH"
  | "NOT_FOUND";

export class SaveInstructionError extends Error {
  code: InstructionWriteErrorCode;

  constructor(code: InstructionWriteErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type SharedOptions = {
  claudeRootDir?: string;
  codexRootDir?: string;
  hermesRootDir?: string;
  instructionPaths?: InstructionPathSettings;
};

type UpdateInstructionInput = {
  path: string;
  content: string;
  previousHash: string | null;
};

function ensurePathInside(realRoot: string, realCandidate: string) {
  // 两个参数必须已经通过 realpath 展开，此函数只做字符串比较
  return realCandidate === realRoot || realCandidate.startsWith(realRoot + sep);
}

async function ensureWritableTarget(targetPath: string, rootPath: string) {
  const parentDir = dirname(targetPath);

  let realRoot: string;
  try {
    realRoot = await realpath(rootPath);
  } catch {
    throw new SaveInstructionError("INVALID_PATH", "根目录不存在或无法访问。");
  }

  // 创建目录后再用 realpath 验证，确保符号链接已完全展开
  await mkdir(parentDir, { recursive: true });

  let realParent: string;
  try {
    realParent = await realpath(parentDir);
  } catch {
    throw new SaveInstructionError("INVALID_PATH", "目标路径超出了允许写入的根目录。");
  }

  if (!ensurePathInside(realRoot, realParent) && realParent !== realRoot) {
    throw new SaveInstructionError("INVALID_PATH", "目标路径超出了允许写入的根目录。");
  }

  try {
    const currentStat = await lstat(targetPath);
    if (!currentStat.isFile() || currentStat.isSymbolicLink()) {
      throw new SaveInstructionError("INVALID_PATH", "目标路径不是可直接写入的普通文件。");
    }
  } catch (error) {
    if (error instanceof SaveInstructionError) {
      throw error;
    }
    throw new SaveInstructionError("INVALID_PATH", "无法验证目标路径: " + (error as Error).message);
  }
}

function getRoots(options: SharedOptions) {
  return {
    claudeRootDir: options.claudeRootDir || join(homedir(), ".claude"),
    codexRootDir: options.codexRootDir || process.env.CODEX_HOME || join(homedir(), ".codex"),
    hermesRootDir: options.hermesRootDir
      || process.env.HERMES_HOME
      || (process.platform === "win32" && process.env.LOCALAPPDATA
        ? join(process.env.LOCALAPPDATA, "hermes")
        : join(homedir(), ".hermes")),
    instructionPaths: options.instructionPaths
  };
}

function resolveUpdateTarget(path: string, options: ReturnType<typeof getRoots>) {
  if (!isAbsolute(path)) {
    throw new SaveInstructionError("INVALID_PATH", "目标路径无效。");
  }

  const paths = resolveInstructionPaths(options.instructionPaths, options);
  const agent = agentForPath(paths, path);

  if (agent) {
    const targetPath = paths.pathsByAgent[agent];
    if (targetPath) {
      return { path: targetPath, rootPath: dirname(targetPath) };
    }
  }

  throw new SaveInstructionError("INVALID_PATH", "目标路径不在允许更新的全局规则范围内。");
}

export async function updateInstructionAsset(
  input: UpdateInstructionInput,
  options: SharedOptions = {}
) {
  const settings = options.instructionPaths ? null : await readSettings();
  const roots = getRoots({
    ...options,
    instructionPaths: options.instructionPaths ?? settings?.instructionPaths,
  });
  const target = resolveUpdateTarget(input.path, roots);
  const currentContent = await readPreview(target.path);

  if (currentContent === null) {
    throw new SaveInstructionError("NOT_FOUND", "目标文件不存在，请重新加载后再试。");
  }

  const currentHash = hashInstructionContent(currentContent);
  if (input.previousHash !== currentHash) {
    throw new SaveInstructionError("STALE_CONTENT", "文件内容已经变化，请刷新后重试。");
  }

  await ensureWritableTarget(target.path, target.rootPath);
  await writeFile(target.path, input.content, "utf8");

  return {
    ok: true,
    path: target.path,
    contentHash: hashInstructionContent(input.content),
    exists: true
  };
}
