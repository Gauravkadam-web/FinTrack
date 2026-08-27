import { apiClient } from "@/lib/api-client";
import { Budget, BudgetListResponse } from "@/types";

export async function listBudgets(month?: string): Promise<BudgetListResponse> {
  return apiClient<BudgetListResponse>("budgets", {
    params: { month },
  });
}

export async function createBudget(data: {
  category_id?: string | null;
  period_month: string;
  limit_amount: number;
}): Promise<Budget> {
  const normalizedMonth =
    data.period_month.length === 7 ? `${data.period_month}-01` : data.period_month;
  return apiClient<Budget>("budgets", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      period_month: normalizedMonth,
    }),
  });
}

export async function updateBudget(
  id: string,
  data: { limit_amount: number }
): Promise<Budget> {
  return apiClient<Budget>(`budgets/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  return apiClient<void>(`budgets/${id}`, {
    method: "DELETE",
  });
}
