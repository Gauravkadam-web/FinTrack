"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function NewExpensePage() {
  const router = useRouter();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { addExpense } = useExpenses();

  const handleCreate = async (data: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: "cash" | "card" | "upi" | "other" | null;
  }) => {
    await addExpense(data);
    router.push("/expenses");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Breadcrumb & Navigation */}
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Expenses
        </Link>

        {/* Page Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-7 border border-border shadow-md space-y-5">
          <div className="pb-3.5 border-b border-border">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Record New Expense
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add a new expense transaction with category, amount, and date.
            </p>
          </div>

          {isCategoriesLoading ? (
            <CardSkeleton />
          ) : (
            <ExpenseForm
              categories={categories}
              onSubmit={handleCreate}
              onCancel={() => router.push("/expenses")}
              submitLabel="Save Expense"
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
