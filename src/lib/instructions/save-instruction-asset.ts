import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";

import { hashInstructionContent } from "@/src/lib/instructions/hash-instruction-content";

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
};

type UpdateInstructionInput = {
  path: string;
  content: string;
  previousHash: string | null;
};

async function readContent(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

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
        : join(homedir(), ".hermes"))
  };
}

function resolveUpdateTarget(path: string, options: ReturnType<typeof getRoots>) {
  if (!isAbsolute(path)) {
    throw new SaveInstructionError("INVALID_PATH", "目标路径无效。");
  }

  const resolvedPath = resolve(path);
  const claudeRootFile = join(options.claudeRootDir, "CLAUDE.md");
  const codexMainFile = join(options.codexRootDir, "AGENTS.md");
  const hermesMainFile = join(options.hermesRootDir, "AGENTS.md");

  if (resolvedPath === resolve(claudeRootFile)) {
    return { path: claudeRootFile, rootPath: options.claudeRootDir };
  }
  if (resolvedPath === resolve(codexMainFile)) {
    return { path: codexMainFile, rootPath: options.codexRootDir };
  }
  if (resolvedPath === resolve(hermesMainFile)) {
    return { path: hermesMainFile, rootPath: options.hermesRootDir };
  }

  throw new SaveInstructionError("INVALID_PATH", "目标路径不在允许更新的全局规则范围内。");
}

export async function updateInstructionAsset(
  input: UpdateInstructionInput,
  options: SharedOptions = {}
) {
  const roots = getRoots(options);
  const target = resolveUpdateTarget(input.path, roots);
  const currentContent = await readContent(target.path);

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
