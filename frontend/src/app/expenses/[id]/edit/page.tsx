"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import * as expensesApi from "@/lib/api/expenses";
import { Expense } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastContext";

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { editExpense } = useExpenses();
  const { error: toastError } = useToast();

  useEffect(() => {
    async function loadExpense() {
      try {
        setIsLoading(true);
        const data = await expensesApi.getExpense(expenseId);
        setExpense(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load expense";
        toastError(msg);
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    }

    if (expenseId) {
      loadExpense();
    }
  }, [expenseId, router, toastError]);

  const handleUpdate = async (data: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: "cash" | "card" | "upi" | "other" | null;
  }) => {
    await editExpense(expenseId, data);
    router.push("/expenses");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Breadcrumb */}
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
              Edit Expense
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update transaction details for &quot;{expense?.title || "Transaction"}&quot;.
            </p>
          </div>

          {isLoading || isCategoriesLoading || !expense ? (
            <CardSkeleton />
          ) : (
            <ExpenseForm
              initialValues={{
                title: expense.title,
                category_id: expense.category_id,
                amount: Number(expense.amount),
                expense_date: expense.expense_date,
                notes: expense.notes,
                payment_mode: expense.payment_mode,
              }}
              categories={categories}
              onSubmit={handleUpdate}
              onCancel={() => router.push("/expenses")}
              submitLabel="Save Changes"
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
