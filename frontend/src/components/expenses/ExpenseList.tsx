"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Expense } from "@/types";
import { formatDate, formatINR } from "@/lib/utils";
import { PaymentModeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface ExpenseListProps {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ExpenseList({
  expenses,
  pagination,
  onPageChange,
  onDeleteExpense,
  isLoading,
}: ExpenseListProps) {
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      setIsDeleting(true);
      await onDeleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    } catch (err) {
      console.error("Failed to delete expense", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No Expenses Found"
        description="No expenses match your search or filter criteria. Try adjusting your filters or record a new expense."
        actionLabel="+ Record Expense"
        onAction={() => {
          window.location.href = "/expenses/new";
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop Table (hidden on mobile/tablet) */}
        <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Title & Notes</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Payment Mode</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-sm">
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-surface-100/50 transition-colors group"
                >
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs font-semibold">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                      {expense.title}
                    </div>
                    {expense.notes && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5 font-normal">
                        {expense.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-surface-200/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70">
                      {expense.category_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <PaymentModeBadge mode={expense.payment_mode} />
                  </td>
                  <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 dark:text-white text-base">
                    {formatINR(expense.amount)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Link href={`/expenses/${expense.id}/edit`}>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-200 transition-colors"
                          title="Edit"
                          aria-label="Edit Expense"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeletingExpense(expense)}
                        className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                        aria-label="Delete Expense"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (shown only on small screens) */}
        <div className="md:hidden space-y-2.5">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="glass-card rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {formatDate(expense.expense_date)}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">{expense.title}</h4>
                </div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatINR(expense.amount)}
                </span>
              </div>

              {expense.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-surface-50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                  {expense.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-surface-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                    {expense.category_name || "Uncategorized"}
                  </span>
                  <PaymentModeBadge mode={expense.payment_mode} />
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/expenses/${expense.id}/edit`}>
                    <button
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-surface-100 border border-slate-200 dark:border-slate-800"
                      aria-label="Edit Expense"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeletingExpense(expense)}
                    className="p-1.5 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20"
                    aria-label="Delete Expense"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </strong>{" "}
              of <strong className="text-slate-800 dark:text-slate-200">{pagination.totalCount}</strong> expenses
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-surface-100 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={
          <div>
            Are you sure you want to delete <strong>&quot;{deletingExpense?.title}&quot;</strong> (
            {formatINR(deletingExpense?.amount)})? This action cannot be undone.
          </div>
        }
        confirmLabel="Delete Expense"
        isLoading={isDeleting}
      />
    </>
  );
}
