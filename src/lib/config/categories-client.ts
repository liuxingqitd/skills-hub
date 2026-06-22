import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";
import type { Category } from "@/src/types/categories";

export type CategoryDraft = {
  name: string;
  desc: string;
  icon: string;
  color: string;
};

export async function loadCategories(): Promise<Category[]> {
  if (isTauriRuntime()) {
    return invokeTauri<Category[]>("get_categories");
  }

  const res = await fetch("/api/categories", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载分类失败：${res.status}`);
  return (await res.json()) as Category[];
}

export async function createCategory(input: CategoryDraft): Promise<Category> {
  if (isTauriRuntime()) {
    return invokeTauri<Category>("create_category", { input });
  }

  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`添加分类失败：${res.status}`);
  return (await res.json()) as Category;
}

export async function updateCategory(
  id: string,
  input: CategoryDraft
): Promise<Category> {
  if (isTauriRuntime()) {
    return invokeTauri<Category>("update_category", { input: { id, ...input } });
  }

  const res = await fetch("/api/categories", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...input }),
  });
  if (!res.ok) throw new Error(`更新分类失败：${res.status}`);
  return (await res.json()) as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (isTauriRuntime()) {
    await invokeTauri("delete_category", { input: { id } });
    return;
  }

  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`删除分类失败：${res.status}`);
}
