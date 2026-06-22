import { DashboardPage } from "@/src/components/dashboard/dashboard-page";
import { buildSkillBoardModel } from "@/src/lib/server/build-skill-board-model";
import type { SkillBoardModel } from "@/src/types/board";
import { connection } from "next/server";

const isDesktopBuild = process.env.SKILLS_HUB_DESKTOP === "1";

const desktopBuildModel: SkillBoardModel = {
  agents: [],
  rows: [],
  categories: [],
  pendingSyncCount: 0,
};

export default async function HomePage() {
  if (isDesktopBuild) {
    return <DashboardPage model={desktopBuildModel} />;
  }

  await connection();
  const model = await buildSkillBoardModel();

  return <DashboardPage model={model} />;
}
