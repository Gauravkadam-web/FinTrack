"use client";

import React, { useMemo } from "react";
import { TiltCard } from "@/components/ui/TiltCard";
import { IsometricBudgetGauge } from "@/components/charts/IsometricBudgetGauge";
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
        };
      case "warning":
        return {
          label: "Near Safe Daily Limit",
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      default:
        return {
          label: "On Track / Safe Spend",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
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
      maxTilt={10}
      scaleOnHover={1.02}
      className="p-5 sm:p-6"
    >
      <div className="flex flex-col h-full justify-between space-y-6">
        {/* Header: Date & Status Badge with 50px translateZ */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2" style={{ transform: "translateZ(20px)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Daily Budget Tracker
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" style={{ transform: "translateZ(28px)" }}>
              {todayStr} • Day {dayOfMonth} of {totalDaysInMonth} ({daysLeft} days remaining)
            </p>
          </div>

          <div style={{ transform: "translateZ(50px)" }}>
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${badge.bg} transition-colors inline-block`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Gauge + Metrics Deck Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Isometric SVG Radial Gauge (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-2">
            <IsometricBudgetGauge
              percentage={dailySafeLimit > 0 ? (todaySpent / dailySafeLimit) * 100 : (todaySpent > 0 ? 100 : 0)}
              status={status}
              label={dailySafeLimit > 0 ? `${((todaySpent / dailySafeLimit) * 100).toFixed(0)}%` : "0%"}
              sublabel="Daily Safe Limit"
            />
            <span className="text-xs font-semibold text-slate-400 mt-2" style={{ transform: "translateZ(28px)" }}>
              {todaySpent > dailySafeLimit ? "Exceeded allowance" : "Safe zone burn rate"}
            </span>
          </div>

          {/* 3D Core Metrics Row (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Today's Spent */}
            <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
              <span
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                style={{ transform: "translateZ(28px)" }}
              >
                Today&apos;s Spend
              </span>
              <div className="mt-2" style={{ transform: "translateZ(32px)" }}>
                <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {formatINR(todaySpent)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {todayExpenses.length} {todayExpenses.length === 1 ? "expense" : "expenses"} today
                </p>
              </div>
            </div>

            {/* 2. Daily Safe Limit */}
            <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between" style={{ transform: "translateZ(28px)" }}>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Safe Daily Limit
                </span>
                <span
                  className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded"
                  style={{ transform: "translateZ(50px)" }}
                >
                  Dynamic
                </span>
              </div>
              <div className="mt-2" style={{ transform: "translateZ(32px)" }}>
                <span className="text-xl sm:text-2xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
                  {formatINR(dailySafeLimit)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Remaining ÷ {daysLeft} days
                </p>
              </div>
            </div>

            {/* 3. Daily Target Baseline */}
            <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col justify-between transform transition-transform hover:-translate-y-0.5">
              <span
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                style={{ transform: "translateZ(28px)" }}
              >
                Target Baseline
              </span>
              <div className="mt-2" style={{ transform: "translateZ(32px)" }}>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
                  {formatINR(dailyTarget)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Monthly ÷ {totalDaysInMonth} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Expense Stream */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between" style={{ transform: "translateZ(28px)" }}>
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
                    <span
                      className="w-6 h-6 rounded-lg bg-surface-200 flex items-center justify-center font-bold text-[10px] text-primary-600 dark:text-primary-400"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      {exp.payment_mode === "upi" ? "⚡" : exp.payment_mode === "card" ? "💳" : "💵"}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground" style={{ transform: "translateZ(28px)" }}>
                        {exp.title}
                      </span>
                      <p className="text-[10px] text-slate-400">{exp.category_name}</p>
                    </div>
                  </div>
                  <span
                    className="font-bold text-foreground"
                    style={{ transform: "translateZ(32px)" }}
                  >
                    {formatINR(Number(exp.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
