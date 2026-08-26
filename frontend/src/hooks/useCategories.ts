"use client";

import { useState, useEffect, useCallback } from "react";
import { Category } from "@/types";
import * as categoriesApi from "@/lib/api/categories";
import { useToast } from "@/components/ui/ToastContext";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriesApi.listCategories();
      setCategories(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    try {
      const created = await categoriesApi.createCategory(name);
      setCategories((prev) => [...prev, created]);
      success(`Category "${name}" created successfully`);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toastError(msg);
      throw err;
    }
  };

  const updateCategoryName = async (id: string, name: string) => {
    try {
      const updated = await categoriesApi.updateCategory(id, name);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: updated.name } : c))
      );
      success(`Category renamed to "${name}"`);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rename category";
      toastError(msg);
      throw err;
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id);
      success("Category deleted. Expenses reassigned to 'Uncategorized'.");
      await fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      toastError(msg);
      throw err;
    }
  };

  const getExpenseCount = async (id: string) => {
    const res = await categoriesApi.getCategoryExpenseCount(id);
    return res.expense_count;
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories: fetchCategories,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
  };
}
