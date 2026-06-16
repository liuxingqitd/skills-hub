import { NextResponse } from "next/server";
import { z } from "zod";

import { writeEnabledAgentIds } from "@/src/lib/config/agent-registry-store";
import { loadAllRegistryAgents } from "@/src/lib/config/load-agents";
import { invalidateOverviewModelCache } from "@/src/lib/server/build-overview-model";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents, { headers: NO_STORE_HEADERS });
}

const updateSchema = z.object({
  enabledIds: z.array(z.string()),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
  await writeEnabledAgentIds(parsed.data.enabledIds);
  invalidateOverviewModelCache();

  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents, { headers: NO_STORE_HEADERS });
}
