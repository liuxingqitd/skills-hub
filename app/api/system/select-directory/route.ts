import { execFile } from "node:child_process";
import { platform } from "node:os";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function POST() {
  try {
    const selectedPath = await selectDirectory();
    if (!selectedPath) {
      return NextResponse.json(
        { error: "No directory selected" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json({ path: selectedPath }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Directory picker unavailable" },
      { status: 501, headers: NO_STORE_HEADERS }
    );
  }
}

async function selectDirectory(): Promise<string> {
  const currentPlatform = platform();
  if (currentPlatform === "darwin") {
    const { stdout } = await execFileAsync("osascript", [
      "-e",
      'POSIX path of (choose folder with prompt "选择 Agent 的 Skill 文件夹")',
    ]);
    return stdout.trim();
  }

  if (currentPlatform === "win32") {
    const script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
      "$dialog.Description = '选择 Agent 的 Skill 文件夹'",
      "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.SelectedPath }",
    ].join("; ");
    const { stdout } = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-STA",
      "-Command",
      script,
    ]);
    return stdout.trim();
  }

  const linuxPickers = [
    ["zenity", "--file-selection", "--directory", "--title=选择 Agent 的 Skill 文件夹"],
    ["kdialog", "--getexistingdirectory"],
  ];

  let lastError: unknown;
  for (const [command, ...args] of linuxPickers) {
    try {
      const { stdout } = await execFileAsync(command, args);
      return stdout.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Directory picker unavailable");
}
