import { NextResponse } from "next/server";
import { z } from "zod";

import { writeEnabledAgentIds } from "@/src/lib/config/agent-registry-store";
import { loadAllRegistryAgents } from "@/src/lib/config/load-agents";

export async function GET() {
  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents);
}

const updateSchema = z.object({
  enabledIds: z.array(z.string()),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await writeEnabledAgentIds(parsed.data.enabledIds);

  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents);
}
