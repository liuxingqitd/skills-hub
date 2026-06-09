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

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(settings);
  }

  const updated = { ...settings, ...patch };
  await writeSettings(updated);
  return NextResponse.json(updated);
}
