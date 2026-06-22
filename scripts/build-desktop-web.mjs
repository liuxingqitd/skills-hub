import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
const shadowRoot = resolve(workspaceRoot, ".next-desktop-export");
const shadowOut = join(shadowRoot, "out");
const finalOut = join(workspaceRoot, "out");
const command = process.platform === "win32" ? "npx.cmd" : "npx";

await rm(shadowRoot, { recursive: true, force: true });
await mkdir(shadowRoot, { recursive: true });

await Promise.all([
  copyAppWithoutApi(),
  copyIfExists("next-env.d.ts"),
  copyIfExists("next.config.ts"),
  copyIfExists("package.json"),
  copyIfExists("package-lock.json"),
  copyIfExists("postcss.config.js"),
  copyIfExists("tsconfig.json"),
  copyIfExists("middleware.ts"),
  linkIfExists("config"),
  linkIfExists("public"),
  linkIfExists("src"),
  linkIfExists("node_modules"),
]);

try {
  await runNextBuild();
  await rm(finalOut, { recursive: true, force: true });
  await cp(shadowOut, finalOut, { recursive: true });
} finally {
  if (process.env.SKILLS_HUB_KEEP_DESKTOP_SHADOW !== "1") {
    await rm(shadowRoot, { recursive: true, force: true });
  }
}

async function copyAppWithoutApi() {
  await cp(join(workspaceRoot, "app"), join(shadowRoot, "app"), {
    recursive: true,
    filter: (source) => source !== join(workspaceRoot, "app", "api"),
  });
}

async function copyIfExists(relativePath) {
  try {
    const source = join(workspaceRoot, relativePath);
    const target = join(shadowRoot, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(source));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function linkIfExists(relativePath) {
  try {
    await symlink(join(workspaceRoot, relativePath), join(shadowRoot, relativePath), "junction");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function runNextBuild() {
  const child = spawn(command, ["next", "build"], {
    cwd: shadowRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      SKILLS_HUB_DESKTOP: "1",
    },
  });

  const result = await new Promise((resolveResult) => {
    child.on("exit", (code, signal) => resolveResult({ code, signal }));
  });

  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }

  if (result.code !== 0) {
    process.exit(result.code ?? 1);
  }
}
