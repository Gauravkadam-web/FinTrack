"use client";

import { useState, useEffect, useCallback } from "react";
import { BudgetListResponse } from "@/types";
import * as budgetsApi from "@/lib/api/budgets";
import { getCurrentMonthStr } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastContext";

export function useBudget(initialMonth?: string) {
  const [month, setMonth] = useState<string>(initialMonth || getCurrentMonthStr());
  const [budgetData, setBudgetData] = useState<BudgetListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchBudget = useCallback(async (targetMonth?: string) => {
    const m = targetMonth || month;
    try {
      setIsLoading(true);
      setError(null);
      const data = await budgetsApi.listBudgets(m);
      setBudgetData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load budget data";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudget(month);
  }, [month, fetchBudget]);

  const setOrUpdateBudget = async (data: {
    id?: string;
    category_id?: string | null;
    period_month: string;
    limit_amount: number;
  }) => {
    try {
      if (data.id) {
        await budgetsApi.updateBudget(data.id, { limit_amount: data.limit_amount });
        success("Budget limit updated successfully");
      } else {
        await budgetsApi.createBudget({
          category_id: data.category_id,
          period_month: data.period_month,
          limit_amount: data.limit_amount,
        });
        success("Budget set successfully");
      }
      await fetchBudget(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save budget";
      toastError(msg);
      throw err;
    }
  };

  const removeBudget = async (id: string) => {
    try {
      await budgetsApi.deleteBudget(id);
      success("Budget removed");
      await fetchBudget(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove budget";
      toastError(msg);
      throw err;
    }
  };

  // FR-27: Live reconciliation trigger to call after expense mutations
  const reconcileBudget = useCallback(async () => {
    await fetchBudget(month);
  }, [fetchBudget, month]);

  return {
    month,
    setMonth,
    budgetData,
    isLoading,
    error,
    refreshBudget: reconcileBudget,
    setOrUpdateBudget,
    removeBudget,
  };
}
