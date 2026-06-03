import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { Category } from "@/src/types/categories";

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string(),
  desc: z.string(),
  color: z.string(),
  order: z.number(),
  isPreset: z.boolean(),
  keywords: z.array(z.string())
});

const CATEGORIES_PATH = path.resolve(process.cwd(), "config/categories.json");

export async function readCategories(): Promise<Category[]> {
  try {
    const raw = await readFile(CATEGORIES_PATH, "utf-8");
    return z.array(categorySchema).parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read categories:", err);
    }
    return [];
  }
}

export async function writeCategories(categories: Category[]): Promise<void> {
  await writeFile(CATEGORIES_PATH, JSON.stringify(categories, null, 2), "utf-8");
}
