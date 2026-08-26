import { apiClient } from "@/lib/api-client";
import { Expense, ExpenseListResponse, ExpenseQueryParams } from "@/types";

export async function listExpenses(
  params: ExpenseQueryParams = {}
): Promise<ExpenseListResponse> {
  return apiClient<ExpenseListResponse>("expenses", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      category_id: params.category_id,
      date_from: params.date_from,
      date_to: params.date_to,
      amount_min: params.amount_min,
      amount_max: params.amount_max,
      payment_mode: params.payment_mode,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    },
  });
}

export async function createExpense(data: {
  title: string;
  category_id: string;
  amount: number;
  expense_date: string;
  notes?: string | null;
  payment_mode?: string | null;
}): Promise<Expense> {
  return apiClient<Expense>("expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getExpense(id: string): Promise<Expense> {
  return apiClient<Expense>(`expenses/${id}`);
}

export async function updateExpense(
  id: string,
  data: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: string | null;
  }
): Promise<Expense> {
  return apiClient<Expense>(`expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  return apiClient<void>(`expenses/${id}`, {
    method: "DELETE",
  });
}
