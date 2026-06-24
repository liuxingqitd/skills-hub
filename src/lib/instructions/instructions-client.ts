import type {
  InstructionAgent,
  InstructionAsset,
  InstructionKind,
  InstructionScope,
  InstructionsPageModel,
} from "@/src/types/instructions";
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
  let model: InstructionsPageModel;
  if (isTauriRuntime()) {
    model = await invokeTauri<InstructionsPageModel>("get_instructions_model");
    return normalizeInstructionsModel(model);
  }

  const res = await fetch("/api/instructions", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载失败：${res.status}`);
  model = (await res.json()) as InstructionsPageModel;
  return normalizeInstructionsModel(model);
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

function normalizeInstructionsModel(input: unknown): InstructionsPageModel {
  if (!input || typeof input !== "object") {
    return { surfaces: [], assets: [] };
  }

  const model = input as Partial<InstructionsPageModel>;
  const surfaces = Array.isArray(model.surfaces)
    ? model.surfaces.map((surface) => ({
        ...surface,
        assets: Array.isArray(surface.assets) ? surface.assets.map(normalizeAsset) : [],
      }))
    : [];

  const assets = Array.isArray(model.assets) ? model.assets.map(normalizeAsset) : [];
  return { surfaces, assets };
}

function normalizeAsset(asset: unknown): InstructionAsset {
  const input = asset && typeof asset === "object"
    ? asset as Record<string, unknown>
    : {};
  const contentPreview = typeof input.contentPreview === "string" ? input.contentPreview : null;
  const exists = input.exists === true && contentPreview !== null;
  const agent: InstructionAgent =
    input.agent === "claude" || input.agent === "codex" || input.agent === "hermes"
      ? input.agent
      : "codex";
  const kind: InstructionKind =
    input.kind === "rule" || input.kind === "override" || input.kind === "nested"
      ? input.kind
      : "main";
  const scope: InstructionScope = input.scope === "directory" ? "directory" : "user";

  return {
    id: typeof input.id === "string" ? input.id : "",
    agent,
    kind,
    scope,
    status: exists ? "found" : "missing",
    path: typeof input.path === "string" ? input.path : "",
    exists,
    title: typeof input.title === "string" ? input.title : "规则文件",
    description: typeof input.description === "string" ? input.description : "",
    loadBehavior: typeof input.loadBehavior === "string" ? input.loadBehavior : "",
    priority: typeof input.priority === "number" ? input.priority : 0,
    parentPath: typeof input.parentPath === "string" ? input.parentPath : null,
    contentPreview,
    contentHash: typeof input.contentHash === "string" ? input.contentHash : null,
    isEditable: input.isEditable === true && exists,
    canCreate: input.canCreate === true,
  };
}
