import { NextResponse } from "next/server";

import { readSettings, writeSettings } from "@/src/lib/config/settings-store";
import type { AppSettings } from "@/src/lib/config/settings-store";

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const settings = await readSettings();

  const patch: Partial<AppSettings> = {};
  if (payload.syncMode === "copy" || payload.syncMode === "symlink") {
    patch.syncMode = payload.syncMode;
  }
  if (payload.language === "system" || payload.language === "zh" || payload.language === "en") {
    patch.language = payload.language;
  }
  if (payload.instructionPaths && typeof payload.instructionPaths === "object") {
    patch.instructionPaths = {};
    for (const [agent, value] of Object.entries(payload.instructionPaths)) {
      const agentId = agent.trim();
      if (agentId && typeof value === "string" && value.trim()) {
        patch.instructionPaths[agentId] = value.trim();
      }
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(settings);
  }

  const updated = {
    ...settings,
    ...patch,
    instructionPaths: patch.instructionPaths ?? settings.instructionPaths,
  };
  await writeSettings(updated);
  return NextResponse.json(updated);
}
