import { NextResponse } from "next/server";

import { applySyncPlan } from "@/src/lib/sync/apply-sync-plan";
import { buildOverviewModel } from "@/src/lib/server/build-overview-model";
import type { SyncActionType } from "@/src/types/sync";

const VALID_ACTION_TYPES = new Set<string>([
  "create_copy",
  "repair_copy",
  "skip_conflict",
  "remove_orphan",
] satisfies SyncActionType[]);

function filterTypes(raw: unknown): SyncActionType[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is SyncActionType => typeof v === "string" && VALID_ACTION_TYPES.has(v)
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const model = await buildOverviewModel();
  const safeTypes = filterTypes(payload?.types);
  const filteredPlan = {
    ...model.syncPlan,
    actions: model.syncPlan.actions.filter((action) => {
      const matchesSkill =
        typeof payload?.skillName === "string" ? action.skillName === payload.skillName : true;
      const matchesType = safeTypes.length > 0
        ? safeTypes.includes(action.type)
        : true;
      return matchesSkill && matchesType;
    })
  };
  const result = await applySyncPlan(filteredPlan, {
    pruneOrphans: Boolean(payload?.pruneOrphans),
    allowedSourceRoots: model.agents.map((a) => a.skillsPath)
  });

  return NextResponse.json(result);
}
