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
    <div className="glass-card rounded-2xl p-6 border border-slate-800/90 space-y-4 shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent Transactions</h3>
          <p className="text-xs text-slate-400">Latest recorded transactions</p>
        </div>
        <Link
          href="/expenses"
          className="text-xs text-primary-400 hover:text-primary-300 font-semibold px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2.5 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-surface-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 mb-2">
            🧾
          </div>
          <p className="text-xs font-semibold text-slate-300">No transactions recorded</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Transactions logged this month will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-50/70 border border-slate-800/80 hover:border-slate-700/90 hover:bg-surface-100/60 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-surface-100 to-surface-200 border border-slate-700 flex items-center justify-center font-bold text-xs text-primary-300 shrink-0 shadow-inner">
                  ₹
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 text-sm truncate group-hover:text-white transition-colors">
                    {expense.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{formatDate(expense.expense_date)}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium truncate">
                      {expense.category_name || "Uncategorized"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <div className="hidden sm:block">
                  <PaymentModeBadge mode={expense.payment_mode} />
                </div>
                <span className="font-bold text-white text-base">
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
