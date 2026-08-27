"use client";

import React from "react";
import { BudgetSnapshot } from "@/types";
import { formatINR } from "@/lib/utils";
import { BudgetStatusBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface BudgetOverviewCardProps {
  snapshot?: BudgetSnapshot | null;
  onSetBudget: () => void;
  isLoading?: boolean;
}

export function BudgetOverviewCard({
  snapshot,
  onSetBudget,
  isLoading,
}: BudgetOverviewCardProps) {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!snapshot) {
    return (
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-dashed border-border hover:border-slate-400 dark:hover:border-slate-600 transition-colors group h-full shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Monthly Budget
          </span>
          <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-slate-400 border border-border">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="my-2">
          <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
            Not Configured
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Set a monthly spending limit
          </p>
        </div>

        <button
          onClick={onSetBudget}
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-bold self-start inline-flex items-center gap-1 hover:underline pt-1"
        >
          <span>+ Set Target</span>
        </button>
      </div>
    );
  }

  const limitAmount = Number(snapshot.limit_amount);
  const remainingAmount = Number(snapshot.remaining);
  const percentUsed = Math.min(Math.round(snapshot.percentage_used || 0), 100);

  const getProgressColor = () => {
    switch (snapshot.status) {
      case "on_track":
        return "bg-emerald-500";
      case "near_limit":
        return "bg-amber-500";
      case "over_budget":
        return "bg-rose-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full shadow-sm">
      {/* Top row */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 truncate">
          Budget Left
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <BudgetStatusBadge status={snapshot.status} />
          <button
            onClick={onSetBudget}
            className="p-1 rounded-md text-slate-400 hover:text-foreground hover:bg-surface-100 transition-colors"
            title="Edit Budget Limit"
            aria-label="Edit Budget"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Remaining Amount */}
      <div className="my-1">
        <div
          className={`text-xl sm:text-2xl font-extrabold tracking-tight truncate ${
            remainingAmount < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
          }`}
        >
          {formatINR(remainingAmount)}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
          of {formatINR(limitAmount)} limit
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span>{percentUsed}% spent</span>
        </div>
        <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(snapshot.percentage_used, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
