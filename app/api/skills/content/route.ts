import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import * as path from "node:path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ content: "未找到 SKILL.md。" });
  }

  try {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(homedir() + path.sep)) {
      return NextResponse.json({ content: "未找到 SKILL.md。" });
    }
    const content = await readFile(resolved, "utf8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "未找到 SKILL.md。" });
  }
}
