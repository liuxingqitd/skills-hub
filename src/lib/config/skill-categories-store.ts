import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const STORE_PATH = join(process.cwd(), "config", "skill-categories.json");

export async function readSkillCategories(): Promise<Record<string, string[]>> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (
          typeof key === "string" &&
          Array.isArray(value) &&
          value.every((v) => typeof v === "string")
        ) {
          result[key] = value;
        }
      }
      return result;
    }
    return {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read skill categories:", err);
    }
    return {};
  }
}

export async function writeSkillCategories(
  map: Record<string, string[]>
): Promise<void> {
  await writeFile(
    STORE_PATH,
    JSON.stringify(map, null, 2) + "\n",
    "utf8"
  );
}

export async function setSkillCategories(
  skillName: string,
  categoryIds: string[]
): Promise<void> {
  const map = await readSkillCategories();
  if (categoryIds.length === 0) {
    delete map[skillName];
  } else {
    map[skillName] = categoryIds;
  }
  await writeSkillCategories(map);
}
