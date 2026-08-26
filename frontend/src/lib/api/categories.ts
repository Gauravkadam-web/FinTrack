import { apiClient } from "@/lib/api-client";
import { Category } from "@/types";

export async function listCategories(): Promise<Category[]> {
  return apiClient<Category[]>("categories");
}

export async function createCategory(name: string): Promise<Category> {
  return apiClient<Category>("categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  return apiClient<Category>(`categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient<void>(`categories/${id}`, {
    method: "DELETE",
  });
}

export async function getCategoryExpenseCount(
  id: string
): Promise<{ category_id: string; expense_count: number }> {
  return apiClient<{ category_id: string; expense_count: number }>(
    `categories/${id}/expense-count`
  );
}
