import { rm } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { buildOverviewModel } from "@/src/lib/server/build-overview-model";
import { SOURCE_SKILLS_DIR } from "@/src/lib/skills/scan-source-skills";
import { readCustomSkills, writeCustomSkills } from "@/src/lib/config/custom-skills-store";

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const { skillName } = payload ?? {};

  if (typeof skillName !== "string") {
    return NextResponse.json({ ok: false, error: "Missing skillName" }, { status: 400 });
  }

  const model = await buildOverviewModel();

  // Verify the skill exists in the model at all
  if (!model.skills.some((s) => s.name === skillName)) {
    return NextResponse.json({ ok: false, error: "Skill not found" }, { status: 404 });
  }

  const agentById = new Map(model.agents.map((a) => [a.id, a]));

  const removedPaths: string[] = [];
  for (const state of Object.values(model.agentStates).flat()) {
    if (state.skillName === skillName && state.exists) {
      const resolvedTarget = path.resolve(state.targetPath);
      const agent = agentById.get(state.agentId);
      if (!agent) continue;
      const resolvedRoot = path.resolve(agent.skillsPath);
      if (!resolvedTarget.startsWith(resolvedRoot + path.sep)) {
        throw new Error(`Path traversal detected: ${state.targetPath}`);
      }
      removedPaths.push(resolvedTarget);
    }
  }

  // Always try to remove from source directory as well (force: true handles non-existent)
  const sourceSkillPath = path.join(SOURCE_SKILLS_DIR, skillName);
  removedPaths.push(sourceSkillPath);

  await Promise.all(removedPaths.map((p) => rm(p, { recursive: true, force: true })));

  // Also clean up custom-skills.json entry
  const customSkills = await readCustomSkills();
  if (customSkills.includes(skillName)) {
    await writeCustomSkills(customSkills.filter((n) => n !== skillName));
  }

  return NextResponse.json({ ok: true, removed: removedPaths });
}
