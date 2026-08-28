"use client";

import React, { useMemo } from "react";
import { TiltCard } from "@/components/ui/TiltCard";
import { formatINR } from "@/lib/utils";
import { Expense, Budget } from "@/types";

interface DailyBudgetCardProps {
  overallBudget: Budget | null;
  todayExpenses: Expense[];
  isLoading?: boolean;
  onQuickAddExpense?: () => void;
}

export function DailyBudgetCard({
  overallBudget,
  todayExpenses,
  isLoading,
  onQuickAddExpense,
}: DailyBudgetCardProps) {
  // Calculate day metrics
  const {
    todayStr,
    dayOfMonth,
    totalDaysInMonth,
    daysLeft,
    todaySpent,
    dailySafeLimit,
    dailyTarget,
    dailyBurnPercent,
    status,
  } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const remainingDays = Math.max(1, totalDays - day + 1);

    const spent = todayExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthlyLimit = overallBudget ? Number(overallBudget.limit_amount) : 0;
    const monthlyRemaining = overallBudget ? Number(overallBudget.remaining) : 0;

    const target = monthlyLimit > 0 ? monthlyLimit / totalDays : 0;
    const safeLimit = monthlyRemaining > 0 ? monthlyRemaining / remainingDays : 0;

    const burnPercent = safeLimit > 0 ? (spent / safeLimit) * 100 : (spent > 0 ? 100 : 0);

    let stat: "safe" | "warning" | "exceeded" = "safe";
    if (burnPercent >= 100) stat = "exceeded";
    else if (burnPercent >= 80) stat = "warning";

    return {
      todayStr: now.toLocaleDateString("en-IN", { month: "short", day: "numeric", weekday: "short" }),
      dayOfMonth: day,
      totalDaysInMonth: totalDays,
      daysLeft: remainingDays,
      todaySpent: spent,
      dailySafeLimit: safeLimit,
      dailyTarget: target,
      dailyBurnPercent: Math.min(100, burnPercent),
      status: stat,
    };
  }, [overallBudget, todayExpenses]);

  const getStatusBadge = () => {
    switch (status) {
      case "exceeded":
        return {
          label: "Exceeded Today's Safe Limit",
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          barColor: "bg-gradient-to-r from-rose-500 to-rose-600",
          ringColor: "stroke-rose-500",
        };
      case "warning":
        return {
          label: "Near Safe Daily Limit",
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
          ringColor: "stroke-amber-500",
        };
      default:
        return {
          label: "On Track / Safe Spend",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
          ringColor: "stroke-emerald-500",
        };
    }
  };

  const badge = getStatusBadge();

  if (isLoading) {
    return (
      <div className="h-64 rounded-2xl bg-surface-100 animate-pulse border border-border" />
    );
  }

  return (
    <TiltCard
      maxTilt={6}
      scaleOnHover={1.01}
      className="glass-card rounded-2xl border border-border overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-surface-50 via-surface-50 to-surface-100"
    >
      <div className="flex flex-col h-full justify-between space-y-6">
        {/* Header: Date & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Daily Budget Tracker
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {todayStr} • Day {dayOfMonth} of {totalDaysInMonth} ({daysLeft} days remaining)
            </p>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.bg} transition-colors`}
          >
            {badge.label}
          </span>
        </div>

        {/* 3D Core Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Today's Spent */}
          <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Spend
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {formatINR(todaySpent)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {todayExpenses.length} {todayExpenses.length === 1 ? "expense" : "expenses"} logged today
              </p>
            </div>
          </div>

          {/* 2. Daily Safe Limit */}
          <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Safe Daily Limit
              </span>
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded">
                Dynamic
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
                {formatINR(dailySafeLimit)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Remaining balance ÷ {daysLeft} days
              </p>
            </div>
          </div>

          {/* 3. Daily Target Baseline */}
          <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Target Baseline
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
                {formatINR(dailyTarget)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monthly total ÷ {totalDaysInMonth} days
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar & Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Daily Burn Rate</span>
            <span className="text-foreground font-bold">
              {dailySafeLimit > 0 ? ((todaySpent / dailySafeLimit) * 100).toFixed(1) : "0"}% of Safe Limit
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-surface-200 overflow-hidden p-0.5 border border-border">
            <div
              className={`h-full rounded-full ${badge.barColor} transition-all duration-700 ease-out shadow-xs`}
              style={{ width: `${dailyBurnPercent}%` }}
            />
          </div>
        </div>

        {/* Today's Expense Stream */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today&apos;s Transactions ({todayExpenses.length})
            </span>
            {onQuickAddExpense && (
              <button
                onClick={onQuickAddExpense}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                + Add Expense
              </button>
            )}
          </div>

          {todayExpenses.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-100/50 border border-dashed border-border text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No expenses logged today yet. You are well within your safe budget! ✨
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {todayExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-100/80 border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-surface-200 flex items-center justify-center font-bold text-[10px] text-primary-600 dark:text-primary-400">
                      {exp.payment_mode === "upi" ? "⚡" : exp.payment_mode === "card" ? "💳" : "💵"}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground">{exp.title}</span>
                      <p className="text-[10px] text-slate-400">{exp.category_name}</p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">{formatINR(Number(exp.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
