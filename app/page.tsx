import { DashboardPage } from "@/src/components/dashboard/dashboard-page";
import { buildSkillBoardModel } from "@/src/lib/server/build-skill-board-model";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const model = await buildSkillBoardModel();

  return <DashboardPage model={model} />;
}
