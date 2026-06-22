import { NextResponse } from "next/server";
import { z } from "zod";

import {
  writeAgentsConfig,
  writeEnabledAgentIds,
} from "@/src/lib/config/agent-registry-store";
import { loadAllRegistryAgents } from "@/src/lib/config/load-agents";
import { invalidateOverviewModelCache } from "@/src/lib/server/build-overview-model";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents, { headers: NO_STORE_HEADERS });
}

const agentSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  skillsPath: z.string().trim().min(1),
  description: z.string().optional().default(""),
  homepage: z.string().optional().default(""),
  enabled: z.boolean(),
  builtin: z.boolean().optional().default(false),
});

const updateSchema = z.union([
  z.object({
    agents: z.array(agentSchema),
  }),
  z.object({
    enabledIds: z.array(z.string()),
  }),
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  if ("agents" in parsed.data) {
    const ids = new Set<string>();
    for (const agent of parsed.data.agents) {
      if (ids.has(agent.id)) {
        return NextResponse.json(
          { error: `Duplicate agent id: ${agent.id}` },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      ids.add(agent.id);
    }
    await writeAgentsConfig(parsed.data.agents);
  } else {
    await writeEnabledAgentIds(parsed.data.enabledIds);
  }

  invalidateOverviewModelCache();

  const agents = await loadAllRegistryAgents();
  return NextResponse.json(agents, { headers: NO_STORE_HEADERS });
}
