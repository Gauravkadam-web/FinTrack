"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";

// Headless query sync component that safely uses useSearchParams inside Suspense
function SearchParamsSync({
  onParamsChange,
}: {
  onParamsChange: (categoryId?: string, search?: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category_id") || searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    onParamsChange(category, search);
  }, [searchParams, onParamsChange]);

  return null;
}

export default function ExpensesPage() {
  const {
    expenses,
    pagination,
    params,
    updateFilters,
    isLoading,
    removeExpense,
    refreshExpenses,
  } = useExpenses();

  const {
    categories,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
  } = useCategories();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleParamsChange = useCallback(
    (category?: string, search?: string) => {
      if (category && category !== params.category_id) {
        updateFilters({ category_id: category, page: 1 });
      }
      if (search && search !== params.search) {
        updateFilters({ search, page: 1 });
      }
    },
    [params.category_id, params.search, updateFilters]
  );

  const handleResetFilters = () => {
    updateFilters({
      search: undefined,
      category_id: undefined,
      payment_mode: undefined,
      date_from: undefined,
      date_to: undefined,
      amount_min: undefined,
      amount_max: undefined,
      sort_by: "date",
      sort_order: "desc",
      page: 1,
    });
  };

  return (
    <AppLayout
      onExpenseAdded={refreshExpenses}
      onCategoryChanged={refreshExpenses}
    >
      <Suspense fallback={null}>
        <SearchParamsSync onParamsChange={handleParamsChange} />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Expenses Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, and inspect your full transaction history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            leftIcon={
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          >
            Categories
          </Button>

          <Link href="/expenses/new">
            <Button
              size="sm"
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls */}
      <ExpenseFilters
        filters={params}
        categories={categories}
        onFilterChange={updateFilters}
        onReset={handleResetFilters}
      />

      {/* Expenses List Table & Mobile Cards */}
      <ExpenseList
        expenses={expenses}
        pagination={pagination}
        onPageChange={(p) => updateFilters({ page: p })}
        onDeleteExpense={removeExpense}
        isLoading={isLoading}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategoryName}
        onDeleteCategory={async (id) => {
          await removeCategory(id);
          refreshExpenses();
        }}
        getExpenseCount={getExpenseCount}
      />
    </AppLayout>
  );
}
