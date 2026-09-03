"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { BudgetModal } from "@/components/budget/BudgetModal";
import { DailyBudgetCard } from "@/components/budget/DailyBudgetCard";
import { BudgetListCard } from "@/components/budget/BudgetListCard";
import { TiltCard } from "@/components/ui/TiltCard";
import { SpatialTransition } from "@/components/ui/SpatialTransition";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ChartBarIcon, TargetIcon, CalendarIcon } from "@/components/ui/Icons";
import { formatINR, getCurrentMonthStr, getTodayStr } from "@/lib/utils";
import { listExpenses } from "@/lib/api/expenses";
import { Budget, Expense } from "@/types";

export default function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const {
    budgetData,
    isLoading: isBudgetLoading,
    refreshBudget,
    setOrUpdateBudget,
    removeBudget,
  } = useBudget(selectedMonth);

  const { categories, refreshCategories } = useCategories();
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);

  // Tab view: "unified" | "monthly" | "daily"
  const [activeTab, setActiveTab] = useState<"unified" | "monthly" | "daily">("unified");

  // Budget Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Fetch today's expenses
  const fetchTodayExpenses = useCallback(async () => {
    try {
      setIsExpensesLoading(true);
      const today = getTodayStr();
      const res = await listExpenses({
        date_from: today,
        date_to: today,
        limit: 50,
      });
      setTodayExpenses(res.items);
    } catch (err) {
      console.error("Failed to load today's expenses", err);
    } finally {
      setIsExpensesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayExpenses();
  }, [fetchTodayExpenses]);

  // Overall budget from budgetData
  const overallBudget = useMemo(() => {
    return budgetData?.overall || null;
  }, [budgetData]);

  // Category specific budgets
  const categoryBudgets = useMemo(() => {
    return budgetData?.categories || [];
  }, [budgetData]);

  // All budgets combined
  const allBudgets = useMemo(() => {
    const list: Budget[] = [];
    if (budgetData?.overall) list.push(budgetData.overall);
    if (budgetData?.categories) list.push(...budgetData.categories);
    return list;
  }, [budgetData]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const handleSaveBudget = async (data: {
    id?: string;
    category_id?: string | null;
    period_month: string;
    limit_amount: number;
  }) => {
    await setOrUpdateBudget(data);
    await refreshBudget();
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleRefreshAll = () => {
    refreshBudget();
    fetchTodayExpenses();
    refreshCategories();
  };

  const overallSpent = Number(overallBudget?.spent || 0);
  const overallLimit = Number(overallBudget?.limit_amount || 0);
  const overallRemaining = Number(overallBudget?.remaining || 0);
  const overallPercent = overallLimit > 0 ? (overallSpent / overallLimit) * 100 : 0;

  return (
    <AppLayout onExpenseAdded={handleRefreshAll} onCategoryChanged={handleRefreshAll}>
      {/* 1. Page Header & Month Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Budgets & Targets
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              Monthly & Daily
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time monthly limits, daily safe allowances, and category allocations.
          </p>
        </div>

        {/* Month Stepper & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-surface-50 border border-border rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-100 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-foreground min-w-[130px] text-center">
              {formattedMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-100 transition-colors cursor-pointer"
              title="Next Month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-primary-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Set Target</span>
          </button>
        </div>
      </div>

      {/* 2. 3D Hero Metrics Deck (Top Overview) with translateZ hierarchy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Monthly Target */}
        <TiltCard maxTilt={10} className="p-4 sm:p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
            Monthly Target
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1" style={{ transform: "translateZ(32px)" }}>
            {formatINR(overallLimit)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {overallBudget ? "Configured limit" : "No budget set"}
          </p>
        </TiltCard>

        {/* Metric 2: Total Spent This Month */}
        <TiltCard maxTilt={10} className="p-4 sm:p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
            Month Spent
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1" style={{ transform: "translateZ(32px)" }}>
            {formatINR(overallSpent)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {overallBudget ? `${overallPercent.toFixed(1)}% consumed` : "₹0.00 spent"}
          </p>
        </TiltCard>

        {/* Metric 3: Remaining Balance */}
        <TiltCard maxTilt={10} className="p-4 sm:p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
            Remaining Balance
          </span>
          <p
            style={{ transform: "translateZ(32px)" }}
            className={`text-xl sm:text-2xl font-extrabold mt-1 ${
              overallRemaining < 0
                ? "text-rose-500 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {formatINR(overallRemaining)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {overallRemaining < 0 ? "Exceeded budget" : "Available to spend"}
          </p>
        </TiltCard>

        {/* Metric 4: Active Category Budgets */}
        <TiltCard maxTilt={10} className="p-4 sm:p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
            Category Targets
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1" style={{ transform: "translateZ(32px)" }}>
            {categoryBudgets.length} Active
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {categories.length} total categories
          </p>
        </TiltCard>
      </div>

      {/* 3. Segmented View Switcher */}
      <div className="flex justify-center sm:justify-start">
        <SegmentedControl
          options={[
            { value: "unified", label: "Unified Overview", icon: <ChartBarIcon size="xs" /> },
            { value: "monthly", label: "Monthly Allocations", icon: <TargetIcon size="xs" /> },
            { value: "daily", label: "Daily Tracker", icon: <CalendarIcon size="xs" /> },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          size="sm"
        />
      </div>

      {/* 4. Tab Content Rendering with SpatialTransition */}
      {activeTab === "unified" && (
        <SpatialTransition key="unified" className="space-y-6">
          {/* Daily Tracker Card */}
          <DailyBudgetCard
            overallBudget={overallBudget}
            todayExpenses={todayExpenses}
            isLoading={isBudgetLoading || isExpensesLoading}
          />

          {/* Monthly Budgets Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Category Targets</h3>
              <span className="text-xs text-slate-400">
                {categoryBudgets.length} {categoryBudgets.length === 1 ? "allocation" : "allocations"}
              </span>
            </div>

            {categoryBudgets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-50 border border-dashed border-border text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No category-specific budgets set for {formattedMonthLabel}.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl text-xs font-semibold text-foreground border border-border transition-colors cursor-pointer"
                >
                  + Add Category Budget
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBudgets.map((b) => (
                  <BudgetListCard
                    key={b.id}
                    budget={b}
                    onEdit={handleOpenEdit}
                    onDelete={removeBudget}
                  />
                ))}
              </div>
            )}
          </div>
        </SpatialTransition>
      )}

      {activeTab === "monthly" && (
        <SpatialTransition key="monthly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              All Budget Allocations ({allBudgets.length})
            </h3>
            <button
              onClick={handleOpenCreate}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
            >
              + Add Target
            </button>
          </div>

          {allBudgets.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-50 border border-dashed border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto shadow-xs">
                <TargetIcon size="lg" />
              </div>
              <h4 className="font-bold text-foreground">No Budgets Set For This Month</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Setting a monthly budget helps FinTrack calculate your daily safe-to-spend allowance and prevent overspending.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-500 transition-colors cursor-pointer"
              >
                Set First Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBudgets.map((b) => (
                <BudgetListCard
                  key={b.id}
                  budget={b}
                  onEdit={handleOpenEdit}
                  onDelete={removeBudget}
                />
              ))}
            </div>
          )}
        </SpatialTransition>
      )}

      {activeTab === "daily" && (
        <SpatialTransition key="daily" className="space-y-6">
          <DailyBudgetCard
            overallBudget={overallBudget}
            todayExpenses={todayExpenses}
            isLoading={isBudgetLoading || isExpensesLoading}
          />
        </SpatialTransition>
      )}

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleSaveBudget}
        categories={categories}
        initialMonth={selectedMonth}
        initialCategoryId={editingBudget?.category_id || undefined}
        initialLimitAmount={editingBudget ? Number(editingBudget.limit_amount) : undefined}
        budgetId={editingBudget?.id}
      />
    </AppLayout>
  );
}
