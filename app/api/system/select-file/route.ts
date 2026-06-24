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
    const selectedPath = await selectFile();
    if (!selectedPath) {
      return NextResponse.json(
        { error: "No file selected" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json({ path: selectedPath }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "File picker unavailable" },
      { status: 501, headers: NO_STORE_HEADERS }
    );
  }
}

async function selectFile(): Promise<string> {
  const currentPlatform = platform();
  if (currentPlatform === "darwin") {
    const { stdout } = await execFileAsync("osascript", [
      "-e",
      'POSIX path of (choose file with prompt "选择全局规则 Markdown 文件" of type {"md"})',
    ]);
    return stdout.trim();
  }

  if (currentPlatform === "win32") {
    const script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
      "$dialog.Title = '选择全局规则 Markdown 文件'",
      "$dialog.Filter = 'Markdown files (*.md)|*.md|All files (*.*)|*.*'",
      "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.FileName }",
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
    ["zenity", "--file-selection", "--title=选择全局规则 Markdown 文件", "--file-filter=Markdown files | *.md"],
    ["kdialog", "--getopenfilename", ".", "*.md"],
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

  throw lastError instanceof Error ? lastError : new Error("File picker unavailable");
}
