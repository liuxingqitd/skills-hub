import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { ReadableStream as NodeReadableStream } from "node:stream/web";

import { deploySkill } from "@/src/lib/sync/link-skill";
import { SOURCE_SKILLS_DIR } from "@/src/lib/skills/scan-source-skills";
import type { SyncMode } from "@/src/lib/config/settings-store";
import type { AgentDefinition } from "@/src/types/agents";

export type SkillInstallSourceKind = "git" | "local";

export type DiscoveredInstallSkill = {
  name: string;
  sourcePath: string;
  skillFilePath: string;
};

export type SkillInstallCompleted = {
  skillName: string;
  agentId: string;
  agentName: string;
  targetPath: string;
};

export type SkillInstallSkipped = SkillInstallCompleted & {
  reason: string;
};

export type SkillInstallFailed = SkillInstallCompleted & {
  error: string;
};

export type SkillInstallResult = {
  source: string;
  sourceKind: SkillInstallSourceKind;
  discovered: DiscoveredInstallSkill[];
  completed: SkillInstallCompleted[];
  skipped: SkillInstallSkipped[];
  failed: SkillInstallFailed[];
};

type PreparedSource = {
  kind: SkillInstallSourceKind;
  path: string;
  cleanupPath: string | null;
};

const GITHUB_DOWNLOAD_TIMEOUT_MS = 180_000;

/* ============================================================
   GitHub URL parsing & HTTPS download
   ============================================================ */

type GitHubRepo = {
  owner: string;
  repo: string;
  branch?: string;
  subdirectory?: string;
};

function parseGitHubRepo(source: string): GitHubRepo | null {
  // https://github.com/owner/repo/tree/branch/sub/dir
  const treeWithPath = source.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)\/tree\/([^/]+)\/(.+)$/i
  );
  if (treeWithPath) {
    return {
      owner: treeWithPath[1],
      repo: treeWithPath[2].replace(/\.git$/, ""),
      branch: treeWithPath[3],
      subdirectory: treeWithPath[4],
    };
  }

  // https://github.com/owner/repo/tree/branch
  const treeRoot = source.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)\/tree\/([^/\s]+?)(?:\/)?$/i
  );
  if (treeRoot) {
    return {
      owner: treeRoot[1],
      repo: treeRoot[2].replace(/\.git$/, ""),
      branch: treeRoot[3],
    };
  }

  // https://github.com/owner/repo[.git]
  const https = source.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/i
  );
  if (https) return { owner: https[1], repo: https[2] };

  // git@github.com:owner/repo[.git]
  const ssh = source.match(
    /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i
  );
  if (ssh) return { owner: ssh[1], repo: ssh[2] };

  return null;
}

async function validateExtractedPaths(targetPath: string): Promise<void> {
  const resolvedTarget = resolve(targetPath);
  const walk = async (dirPath: string): Promise<void> => {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const resolved = resolve(fullPath);
      if (!resolved.startsWith(resolvedTarget + "/") && resolved !== resolvedTarget) {
        throw new Error(`检测到路径遍历攻击: ${resolved}`);
      }
      if (entry.isDirectory()) {
        await walk(fullPath);
      }
    }
  };
  await walk(resolvedTarget);
}

function extractTarGz(response: Response, targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tar = spawn("tar", [
      "-xzf", "-", "-C", targetPath, "--strip-components=1",
    ], { stdio: ["pipe", "inherit", "inherit"] });

    if (!response.body) {
      reject(new Error("响应体为空"));
      return;
    }

    Readable.fromWeb(response.body as NodeReadableStream).pipe(tar.stdin);

    tar.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`解压失败，tar 退出码: ${code}`));
        return;
      }
      try {
        await validateExtractedPaths(targetPath);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    tar.on("error", (err) => {
      if (err.message.includes("spawn tar ENOENT")) {
        reject(new Error("找不到 tar 命令，请确保系统已安装 tar。"));
      } else {
        reject(err);
      }
    });
  });
}

async function downloadGitHubArchive(
  repo: GitHubRepo,
  tempDir: string,
): Promise<string> {
  const branches = repo.branch ? [repo.branch, "main", "master"] : ["main", "master"];
  let lastError: Error | null = null;

  for (const branch of [...new Set(branches)]) {
    const url = `https://github.com/${repo.owner}/${repo.repo}/archive/refs/heads/${branch}.tar.gz`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GITHUB_DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "skills-hub/1.0" },
      });

      clearTimeout(timeout);

      if (response.status === 404) {
        lastError = new Error(`仓库 ${repo.owner}/${repo.repo} 没有 ${branch} 分支`);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `下载失败 (HTTP ${response.status})，请检查仓库地址或网络连接。`
        );
      }

      const clonePath = join(tempDir, repo.repo);
      await mkdir(clonePath, { recursive: true });
      await extractTarGz(response, clonePath);
      return clonePath;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("下载超时，请检查网络或稍后重试。");
      }
      throw err;
    }
  }

  throw lastError ?? new Error(`无法从 ${repo.owner}/${repo.repo} 下载 archive`);
}

/* ============================================================
   Source classification
   ============================================================ */

function normalizeSource(input: string): string {
  return input.trim();
}

export function classifySkillInstallSource(source: string): SkillInstallSourceKind {
  return parseGitHubRepo(source) ? "git" : "local";
}

function expandLocalPath(source: string): string {
  if (source === "~") {
    return homedir();
  }

  if (source.startsWith("~/")) {
    return join(homedir(), source.slice(2));
  }

  return resolve(source);
}

/* ============================================================
   Source preparation (download or local)
   ============================================================ */

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function assertDirectory(path: string) {
  try {
    const value = await stat(path);
    if (!value.isDirectory()) {
      throw new Error(`Source is not a directory: ${path}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Source is not")) {
      throw error;
    }
    throw new Error(`Source directory does not exist: ${path}`);
  }
}

async function prepareSource(source: string): Promise<PreparedSource> {
  const kind = classifySkillInstallSource(source);

  if (kind === "local") {
    const localPath = expandLocalPath(source);
    await assertDirectory(localPath);
    return { kind, path: localPath, cleanupPath: null };
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "skills-hub-install-"));
  const repo = parseGitHubRepo(source);

  if (!repo) {
    throw new Error("无效的 GitHub 仓库地址。");
  }

  try {
    const extractPath = await downloadGitHubArchive(repo, tempRoot);
    let sourcePath: string;
    if (repo.subdirectory) {
      if (repo.subdirectory.includes("..") || repo.subdirectory.startsWith("/")) {
        throw new Error("Invalid subdirectory path");
      }
      const joined = join(extractPath, repo.subdirectory);
      const resolved = resolve(joined);
      const resolvedExtract = resolve(extractPath);
      if (!resolved.startsWith(resolvedExtract + "/") && resolved !== resolvedExtract) {
        throw new Error("Subdirectory path resolves outside extraction directory");
      }
      sourcePath = resolved;
    } else {
      sourcePath = extractPath;
    }
    return { kind, path: sourcePath, cleanupPath: tempRoot };
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

/* ============================================================
   Skill discovery
   ============================================================ */

export async function discoverInstallableSkills(
  sourcePath: string
): Promise<DiscoveredInstallSkill[]> {
  if (await pathExists(join(sourcePath, "SKILL.md"))) {
    return [
      {
        name: basename(sourcePath),
        sourcePath,
        skillFilePath: join(sourcePath, "SKILL.md")
      }
    ];
  }

  const entries = await readdir(sourcePath, { withFileTypes: true });
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry): Promise<DiscoveredInstallSkill | null> => {
        const skillPath = join(sourcePath, entry.name);
        const skillFilePath = join(skillPath, "SKILL.md");
        if (!(await pathExists(skillFilePath))) {
          return null;
        }
        return {
          name: entry.name,
          sourcePath: skillPath,
          skillFilePath
        };
      })
  );

  return skills.filter((skill): skill is DiscoveredInstallSkill => skill !== null);
}

/* ============================================================
   Main entry: install a skill source to agents
   ============================================================ */

export async function installSkillSource(
  rawSource: string,
  agents: AgentDefinition[],
  sourceSkillsDir: string = SOURCE_SKILLS_DIR,
  syncMode: SyncMode = "copy"
): Promise<SkillInstallResult> {
  const source = normalizeSource(rawSource);
  if (!source) {
    throw new Error("请输入 GitHub skill 项目地址或本地目录。");
  }

  const prepared = await prepareSource(source);
  const result: SkillInstallResult = {
    source,
    sourceKind: prepared.kind,
    discovered: [],
    completed: [],
    skipped: [],
    failed: []
  };

  try {
    const discovered = await discoverInstallableSkills(prepared.path);
    result.discovered = discovered;

    if (discovered.length === 0) {
      throw new Error("没有找到包含 SKILL.md 的 skill 目录。");
    }

    for (const skill of discovered) {
      // Step A: 先安装到权威数据源
      const sourceTargetPath = join(sourceSkillsDir, skill.name);
      let sourceReady = false;

      try {
        if (await pathExists(sourceTargetPath)) {
          sourceReady = true;
        } else {
          await deploySkill(skill.sourcePath, sourceTargetPath, syncMode);
          sourceReady = true;
        }
      } catch (error) {
        result.failed.push({
          skillName: skill.name,
          agentId: "source",
          agentName: "Source",
          targetPath: sourceTargetPath,
          error: error instanceof Error ? error.message : "Unknown install error"
        });
      }

      if (!sourceReady) continue;

      // Step B: 从权威数据源同步到各 agent 目录
      for (const agent of agents) {
        const targetPath = join(agent.skillsPath, skill.name);
        const base = {
          skillName: skill.name,
          agentId: agent.id,
          agentName: agent.name,
          targetPath
        };

        try {
          if (await pathExists(targetPath)) {
            result.skipped.push({
              ...base,
              reason: "目标目录已存在，未覆盖。"
            });
            continue;
          }

          await deploySkill(sourceTargetPath, targetPath, syncMode);
          result.completed.push(base);
        } catch (error) {
          result.failed.push({
            ...base,
            error: error instanceof Error ? error.message : "Unknown install error"
          });
        }
      }
    }

    return result;
  } finally {
    if (prepared.cleanupPath) {
      await rm(prepared.cleanupPath, { recursive: true, force: true });
    }
  }
}
