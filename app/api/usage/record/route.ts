import { NextResponse } from "next/server";
import { z } from "zod";

import { appendSkillUsageEvent } from "@/src/lib/usage/usage-store";

const usageRecordSchema = z.object({
  skillName: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
  source: z.enum(["codex-log", "claude-log", "cursor-log", "manual", "hook"]),
  confidence: z.enum(["exact", "inferred"]).default("exact"),
  occurredAt: z.string().datetime().optional(),
  workspacePath: z.string().optional(),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = usageRecordSchema.parse(raw);
    const event = await appendSkillUsageEvent(body);

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.warn("[usage] record failed");
    return NextResponse.json({ error: "记录 Skill 调用失败" }, { status: 500 });
  }
}
