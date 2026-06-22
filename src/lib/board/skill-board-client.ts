import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";
import type { SkillBoardModel } from "@/src/types/board";

export async function loadRuntimeSkillBoardModel(): Promise<SkillBoardModel | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  return invokeTauri<SkillBoardModel>("get_skill_board_model");
}
