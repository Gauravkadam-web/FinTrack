"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense, ExpenseListResponse, ExpenseQueryParams } from "@/types";
import * as expensesApi from "@/lib/api/expenses";
import { useToast } from "@/components/ui/ToastContext";

export function useExpenses(initialParams: ExpenseQueryParams = {}) {
  const [params, setParams] = useState<ExpenseQueryParams>({
    page: 1,
    limit: 20,
    sort_by: "date",
    sort_order: "desc",
    ...initialParams,
  });

  const [data, setData] = useState<ExpenseListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await expensesApi.listExpenses(params);
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load expenses";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const updateFilters = (newFilters: Partial<ExpenseQueryParams>) => {
    setParams((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // reset page to 1 on filter changes unless explicit
    }));
  };

  const addExpense = async (expenseData: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: string | null;
  }) => {
    try {
      const created = await expensesApi.createExpense(expenseData);
      success("Expense added successfully");
      await fetchExpenses();
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create expense";
      toastError(msg);
      throw err;
    }
  };

  const editExpense = async (
    id: string,
    expenseData: {
      title: string;
      category_id: string;
      amount: number;
      expense_date: string;
      notes?: string | null;
      payment_mode?: string | null;
    }
  ) => {
    try {
      const updated = await expensesApi.updateExpense(id, expenseData);
      success("Expense updated successfully");
      await fetchExpenses();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update expense";
      toastError(msg);
      throw err;
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await expensesApi.deleteExpense(id);
      success("Expense deleted");
      await fetchExpenses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete expense";
      toastError(msg);
      throw err;
    }
  };

  return {
    expenses: data?.items || [],
    pagination: {
      page: data?.page || 1,
      limit: data?.limit || 20,
      totalCount: data?.total_count || 0,
      totalPages: data?.total_pages || 1,
    },
    params,
    updateFilters,
    isLoading,
    error,
    refreshExpenses: fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
  };
}
