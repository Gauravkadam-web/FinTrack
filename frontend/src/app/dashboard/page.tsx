"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { useCategories } from "@/hooks/useCategories";
import { useBudget } from "@/hooks/useBudget";
import { useExpenses } from "@/hooks/useExpenses";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { SpendTrendChart } from "@/components/charts/SpendTrendChart";
import { BudgetOverviewCard } from "@/components/budget/BudgetOverviewCard";
import { BudgetModal } from "@/components/budget/BudgetModal";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatINR, formatDate, formatMonthYear, getPaymentModeBadge } from "@/lib/utils";

export default function DashboardPage() {
  const {
    month,
    setMonth,
    granularity,
    setGranularity,
    summary,
    trend,
    comparison,
    topCategories,
    averageSpend,
    isLoading,
    isTrendLoading,
    refreshAll,
  } = useDashboard();

  const {
    categories,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
    refreshCategories,
  } = useCategories();

  const { setOrUpdateBudget, refreshBudget } = useBudget(month);
  const { addExpense } = useExpenses();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Live budget and dashboard refresh on expense mutation (FR-27)
  const handleQuickAddExpense = async (data: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: "cash" | "card" | "upi" | "other" | null;
  }) => {
    await addExpense(data);
    refreshAll();
    refreshBudget();
    refreshCategories();
    setIsQuickAddOpen(false);
  };

  const handleSaveBudget = async (data: {
    id?: string;
    category_id?: string | null;
    period_month: string;
    limit_amount: number;
  }) => {
    await setOrUpdateBudget(data);
    refreshAll();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Title and Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Expense Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monthly spend analytics for{" "}
              <span className="text-primary-300 font-semibold">{formatMonthYear(month)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent text-sm text-slate-100 font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsQuickAddOpen(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Total Spent */}
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Total Spent
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                {formatINR(summary?.total_spent)}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {summary?.expense_count || 0} {summary?.expense_count === 1 ? "expense" : "expenses"} recorded
              </p>
            </div>
          )}

          {/* 2. Budget Overview */}
          <div className="sm:col-span-2 lg:col-span-1">
            <BudgetOverviewCard
              snapshot={summary?.budget_snapshot}
              onSetBudget={() => setIsBudgetModalOpen(true)}
              isLoading={isLoading}
            />
          </div>

          {/* 3. MoM Comparison */}
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  MoM Comparison
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  {formatINR(comparison?.difference)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                {comparison?.percentage_change !== null && comparison?.percentage_change !== undefined ? (
                  Number(comparison.percentage_change) > 0 ? (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      ↑ +{comparison.percentage_change}% vs last month
                    </span>
                  ) : Number(comparison.percentage_change) < 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      ↓ {comparison.percentage_change}% vs last month
                    </span>
                  ) : (
                    <span className="text-slate-400">0% change vs last month</span>
                  )
                ) : (
                  <span className="text-slate-400">No previous month data</span>
                )}
              </div>
            </div>
          )}

          {/* 4. Daily Average Spend */}
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Daily Average
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                {formatINR(averageSpend?.average_amount)}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Normalized over last 30 days
              </p>
            </div>
          )}
        </div>

        {/* Charts Row: Spend Trend + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Chart (7 cols on desktop) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 mb-2">Spending Trend</h3>
            <SpendTrendChart
              data={trend?.items || []}
              granularity={granularity}
              onGranularityChange={setGranularity}
              isLoading={isTrendLoading}
            />
          </div>

          {/* Category Donut (5 cols on desktop) */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 mb-2">Category Breakdown</h3>
            <CategoryPieChart
              data={summary?.category_breakdown || []}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Bottom Row: Top Categories + Recent Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top 5 Categories (5 cols) */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Top Spending Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                Manage
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-surface-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !topCategories || topCategories.items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No expense data in this month
              </div>
            ) : (
              <div className="space-y-3">
                {topCategories.items.map((cat) => (
                  <div
                    key={cat.category_id}
                    className="p-3 rounded-xl bg-surface-50/60 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-surface-200 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                          #{cat.rank}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {cat.category_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">
                          {formatINR(cat.total_spent)}
                        </span>
                        <span className="text-slate-400 font-medium">
                          ({cat.percentage_of_total}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.min(cat.percentage_of_total, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent 5 Expenses (7 cols) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Recent Transactions</h3>
              <Link
                href="/expenses"
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                View All →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-surface-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !summary?.recent_expenses || summary.recent_expenses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent transactions in this month.
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.recent_expenses.map((expense) => {
                  const modeBadge = getPaymentModeBadge(expense.payment_mode);

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-50/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-100 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-primary">
                          ₹
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-sm">
                            {expense.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{formatDate(expense.expense_date)}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">
                              {expense.category_name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {expense.payment_mode && (
                          <span
                            className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${modeBadge.bg}`}
                          >
                            {modeBadge.label}
                          </span>
                        )}
                        <span className="font-extrabold text-slate-100 text-base">
                          {formatINR(expense.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick Add Expense Modal */}
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

      {/* Monthly Budget Setup Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSubmit={handleSaveBudget}
        categories={categories}
        initialMonth={month}
        initialLimitAmount={
          summary?.budget_snapshot ? Number(summary.budget_snapshot.limit_amount) : undefined
        }
        budgetId={summary?.budget_snapshot?.id || undefined}
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
          refreshAll();
        }}
        getExpenseCount={getExpenseCount}
      />
    </div>
  );
}
