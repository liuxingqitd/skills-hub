import type { InstructionsPageModel } from "@/src/types/instructions";
import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";
import type { InstructionPathSettings } from "@/src/lib/config/settings-store";

type UpdateInstructionInput = {
  path: string;
  content: string;
  previousHash: string | null;
};

export type UpdateInstructionResult = {
  ok?: boolean;
  path?: string;
  contentHash?: string;
  exists?: boolean;
  code?: string;
  error?: string;
};

export type SelectInstructionFileResult = {
  path: string;
};

export async function loadInstructionsModel(): Promise<InstructionsPageModel> {
  if (isTauriRuntime()) {
    return invokeTauri<InstructionsPageModel>("get_instructions_model");
  }

  const res = await fetch("/api/instructions", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载失败：${res.status}`);
  return (await res.json()) as InstructionsPageModel;
}

export async function saveInstructionAsset(
  input: UpdateInstructionInput
): Promise<UpdateInstructionResult> {
  if (isTauriRuntime()) {
    try {
      return await invokeTauri<UpdateInstructionResult>("update_instruction_asset", { input });
    } catch (error) {
      throw new Error(commandErrorMessage(error, "保存失败"));
    }
  }

  const res = await fetch("/api/instructions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = (await res.json()) as UpdateInstructionResult;
  if (!res.ok || result.ok === false) {
    throw new Error(result.error || `保存失败：${res.status}`);
  }
  return result;
}

export async function loadInstructionPaths(): Promise<InstructionPathSettings> {
  if (isTauriRuntime()) {
    return invokeTauri<InstructionPathSettings>("get_instruction_paths");
  }

  const res = await fetch("/api/settings", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载规则路径失败：${res.status}`);
  const settings = (await res.json()) as { instructionPaths?: InstructionPathSettings };
  return settings.instructionPaths ?? {};
}

export async function saveInstructionPaths(
  instructionPaths: InstructionPathSettings
): Promise<InstructionPathSettings> {
  if (isTauriRuntime()) {
    return invokeTauri<InstructionPathSettings>("set_instruction_paths", {
      input: { instructionPaths },
    });
  }

  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructionPaths }),
  });
  if (!res.ok) throw new Error(`保存规则路径失败：${res.status}`);
  const settings = (await res.json()) as { instructionPaths?: InstructionPathSettings };
  return settings.instructionPaths ?? {};
}

export async function selectInstructionFile(): Promise<string> {
  if (isTauriRuntime()) {
    const result = await invokeTauri<SelectInstructionFileResult>("select_instruction_file");
    return result.path;
  }

  const res = await fetch("/api/system/select-file", { method: "POST" });
  if (!res.ok) throw new Error("File picker unavailable");
  const result = (await res.json()) as SelectInstructionFileResult;
  return result.path;
}

function commandErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeError = error as { error?: unknown; message?: unknown };
    if (typeof maybeError.error === "string") return maybeError.error;
    if (typeof maybeError.message === "string") return maybeError.message;
  }
  return fallback;
}
