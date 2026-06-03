import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const STORE_PATH = join(process.cwd(), "config", "custom-skills.json");

export async function readCustomSkills(): Promise<string[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read custom skills:", err);
    }
    return [];
  }
}

export async function writeCustomSkills(names: string[]): Promise<void> {
  await writeFile(STORE_PATH, JSON.stringify([...new Set(names)].sort(), null, 2) + "\n", "utf8");
}
