"use client";

import React, { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useCategories } from "@/hooks/useCategories";
import { useBudget } from "@/hooks/useBudget";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroMetricsSection } from "@/components/dashboard/HeroMetricsSection";
import { TopCategoriesWidget } from "@/components/dashboard/TopCategoriesWidget";
import { RecentExpensesWidget } from "@/components/dashboard/RecentExpensesWidget";
import { SpendTrendChart } from "@/components/charts/SpendTrendChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { BudgetModal } from "@/components/budget/BudgetModal";
import { QuickAddBar } from "@/components/ai/QuickAddBar";
import { AiInsightsCard } from "@/components/ai/AiInsightsCard";
import { BurnRateBadge } from "@/components/ai/BurnRateBadge";
import { useToast } from "@/components/ui/ToastContext";
import { createExpense } from "@/lib/api/expenses";
import { createCategory } from "@/lib/api/categories";
import { AIParsedExpenseResponse } from "@/types";

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

  const { categories, refreshCategories } = useCategories();
  const { setOrUpdateBudget, refreshBudget } = useBudget(month);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const { success, error } = useToast();

  const handleExpenseAdded = () => {
    refreshAll();
    refreshBudget();
    refreshCategories();
  };

  const handleQuickAddExpense = async (parsed: AIParsedExpenseResponse) => {
    try {
      let catId = parsed.category_id;
      if (!catId) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === parsed.category_name.toLowerCase()
        );
        if (found) {
          catId = found.id;
        } else {
          const newCat = await createCategory(parsed.category_name);
          catId = newCat.id;
          refreshCategories();
        }
      }
      await createExpense({
        title: parsed.title,
        amount: Number(parsed.amount),
        category_id: catId,
        expense_date: parsed.expense_date,
        payment_mode: parsed.payment_mode || "upi",
        notes: parsed.notes || null,
      });
      success(`✨ Added "${parsed.title}" (₹${Number(parsed.amount).toFixed(2)}) via AI!`);
      handleExpenseAdded();
    } catch (err: any) {
      error(err?.message || "Failed to save AI parsed expense.");
    }
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
    <AppLayout
      onExpenseAdded={handleExpenseAdded}
      onCategoryChanged={refreshAll}
    >
      {/* 1. Header with Title, BurnRateBadge, and Month Navigator Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DashboardHeader
          month={month}
          onMonthChange={setMonth}
        />
        <div className="flex items-center justify-end">
          <BurnRateBadge />
        </div>
      </div>

      {/* AI Quick Add Command Bar */}
      <div className="my-1">
        <QuickAddBar onParsedExpense={handleQuickAddExpense} />
      </div>

      {/* AI Financial Health Check Insights Card */}
      <AiInsightsCard />

      {/* 2. Hero Section: Primary Metric Cards + Featured Budget Goal */}
      <HeroMetricsSection
        summary={summary}
        comparison={comparison}
        averageSpend={averageSpend}
        isLoading={isLoading}
        onSetBudget={() => setIsBudgetModalOpen(true)}
      />

      {/* 3. Interactive Analytics Section: Spend Trend Area + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spend Trend Chart (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-4 sm:p-6 border border-border shadow-md flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-bold text-foreground tracking-tight">Spending Trend</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expenditure trajectory across selected timeframe</p>
          </div>
          <SpendTrendChart
            data={trend?.items || []}
            granularity={granularity}
            onGranularityChange={setGranularity}
            isLoading={isTrendLoading}
          />
        </div>

        {/* Category Donut Breakdown (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-4 sm:p-6 border border-border shadow-md flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-bold text-foreground tracking-tight">Category Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of expenditures by category</p>
          </div>
          <CategoryPieChart
            data={summary?.category_breakdown || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 4. Details Section: Top Categories + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top 5 Ranked Categories (5 cols) */}
        <div className="lg:col-span-5">
          <TopCategoriesWidget
            topCategories={topCategories}
            isLoading={isLoading}
          />
        </div>

        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7">
          <RecentExpensesWidget
            expenses={summary?.recent_expenses}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Monthly Budget Setup / Edit Modal */}
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
    </AppLayout>
  );
}
