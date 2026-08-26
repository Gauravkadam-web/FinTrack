"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { Navbar } from "@/components/ui/Navbar";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Expenses
        </Link>

        {/* Page Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Record New Expense
            </h1>
            <p className="text-sm text-slate-400 mt-1">
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
              submitLabel="Save & Finish"
            />
          )}
        </div>
      </main>
    </div>
  );
}
