"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function ExpensesPage() {
  const {
    expenses,
    pagination,
    params,
    updateFilters,
    isLoading,
    addExpense,
    removeExpense,
  } = useExpenses();

  const {
    categories,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
  } = useCategories();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleQuickAddExpense = async (data: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: "cash" | "card" | "upi" | "other" | null;
  }) => {
    await addExpense(data);
    setIsQuickAddOpen(false);
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Expenses Explorer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search, filter, and inspect your full transaction history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              leftIcon={
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
      </main>

      {/* Quick Add Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Record New Expense"
        description="Quickly record your transaction details."
        maxWidth="md"
      >
        <ExpenseForm
          categories={categories}
          onSubmit={handleQuickAddExpense}
          onCancel={() => setIsQuickAddOpen(false)}
          submitLabel="Save Expense"
        />
      </Modal>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategoryName}
        onDeleteCategory={removeCategory}
        getExpenseCount={getExpenseCount}
      />
    </div>
  );
}
