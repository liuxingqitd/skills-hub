import { NextResponse } from "next/server";

import {
  buildOverviewModel,
  invalidateOverviewModelCache,
} from "@/src/lib/server/build-overview-model";
import { loadAllRegistryAgents } from "@/src/lib/config/load-agents";
import { readCustomSkills, writeCustomSkills } from "@/src/lib/config/custom-skills-store";
import { removeSkillInstances } from "@/src/lib/skills/remove-skill-instances";

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

  const agents = await loadAllRegistryAgents();
  const { removedPaths } = await removeSkillInstances(skillName, agents);

  // Also clean up custom-skills.json entry
  const customSkills = await readCustomSkills();
  if (customSkills.includes(skillName)) {
    await writeCustomSkills(customSkills.filter((n) => n !== skillName));
  }

  invalidateOverviewModelCache();

  return NextResponse.json({ ok: true, removed: removedPaths });
}
