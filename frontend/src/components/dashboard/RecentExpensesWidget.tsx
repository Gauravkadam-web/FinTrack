"use client";

import React from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils";
import { PaymentModeBadge } from "@/components/ui/Badge";
import { Expense } from "@/types";

interface RecentExpensesWidgetProps {
  expenses?: Expense[] | null;
  isLoading?: boolean;
}

export function RecentExpensesWidget({
  expenses,
  isLoading,
}: RecentExpensesWidgetProps) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-border space-y-3.5 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Recent Transactions</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest recorded transactions</p>
        </div>
        <Link
          href="/expenses"
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500 font-semibold px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary/10 transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-surface-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-slate-400 mb-1.5 text-xs">
            🧾
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No transactions recorded</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Transactions this month will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-100/60 border border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-surface-100 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-surface-200 border border-border flex items-center justify-center font-bold text-xs text-primary-600 dark:text-primary-300 shrink-0">
                  ₹
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                    {expense.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{formatDate(expense.expense_date)}</span>
                    <span>•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {expense.category_name || "Uncategorized"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className="hidden sm:block">
                  <PaymentModeBadge mode={expense.payment_mode} />
                </div>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {formatINR(expense.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
