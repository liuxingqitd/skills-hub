import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  SkillUsageConfidence,
  SkillUsageEvent,
  SkillUsageSource,
} from "@/src/types/usage";

export const DEFAULT_USAGE_LOG_PATH = join(process.cwd(), "data", "skill-usage.jsonl");

const SOURCES: ReadonlySet<SkillUsageSource> = new Set([
  "codex-log",
  "claude-log",
  "cursor-log",
  "manual",
  "hook",
]);

const CONFIDENCES: ReadonlySet<SkillUsageConfidence> = new Set(["exact", "inferred"]);

export type SkillUsageEventDraft = Omit<SkillUsageEvent, "id" | "occurredAt"> & {
  id?: string;
  occurredAt?: string;
};

export async function readSkillUsageEvents(
  logPath = DEFAULT_USAGE_LOG_PATH
): Promise<SkillUsageEvent[]> {
  let raw: string;
  try {
    raw = await readFile(logPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseSkillUsageEventLine)
    .filter((event): event is SkillUsageEvent => event !== null);
}

export async function appendSkillUsageEvent(
  draft: SkillUsageEventDraft,
  logPath = DEFAULT_USAGE_LOG_PATH
): Promise<SkillUsageEvent> {
  const event: SkillUsageEvent = {
    ...draft,
    id: draft.id ?? randomUUID(),
    occurredAt: draft.occurredAt ?? new Date().toISOString(),
  };

  if (!isSkillUsageEvent(event)) {
    throw new Error("Invalid skill usage event");
  }

  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export function parseSkillUsageEventLine(line: string): SkillUsageEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    return isSkillUsageEvent(value) ? value : null;
  } catch {
    return null;
  }
}

function isSkillUsageEvent(value: unknown): value is SkillUsageEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<SkillUsageEvent>;

  return (
    isNonEmptyString(event.id) &&
    isNonEmptyString(event.skillName) &&
    isNonEmptyString(event.agentId) &&
    isNonEmptyString(event.occurredAt) &&
    Number.isFinite(Date.parse(event.occurredAt)) &&
    typeof event.source === "string" &&
    SOURCES.has(event.source as SkillUsageSource) &&
    typeof event.confidence === "string" &&
    CONFIDENCES.has(event.confidence as SkillUsageConfidence) &&
    isOptionalString(event.workspacePath) &&
    isOptionalString(event.conversationId)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}
