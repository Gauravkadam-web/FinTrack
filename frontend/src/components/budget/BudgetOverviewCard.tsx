"use client";

import React from "react";
import { BudgetSnapshot } from "@/types";
import { formatINR } from "@/lib/utils";
import { BudgetStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-surface-200 rounded" />
        <div className="h-8 w-44 bg-surface-200 rounded" />
        <div className="h-3 w-full bg-surface-200 rounded" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="glass-card rounded-2xl p-6 border-dashed border-slate-800 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Monthly Budget Goal
            </span>
            <span className="text-xs text-slate-500 font-medium">Not set</span>
          </div>
          <h4 className="text-lg font-semibold text-slate-200 mb-1">
            No Budget Set for This Month
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Set an overall monthly spending limit to track expenses and receive real-time threshold warnings.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onSetBudget}
          className="self-start"
          leftIcon={
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Set Monthly Budget
        </Button>
      </div>
    );
  }

  const limitAmount = Number(snapshot.limit_amount);
  const spentAmount = Number(snapshot.spent);
  const remainingAmount = Number(snapshot.remaining);
  const percentUsed = Math.min(Math.round(snapshot.percentage_used || 0), 100);

  const getProgressColor = () => {
    switch (snapshot.status) {
      case "on_track":
        return "bg-emerald-500 shadow-emerald-500/20";
      case "near_limit":
        return "bg-amber-500 shadow-amber-500/20";
      case "over_budget":
        return "bg-rose-500 shadow-rose-500/20";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Monthly Budget Goal
          </span>
          <div className="flex items-center gap-2">
            <BudgetStatusBadge status={snapshot.status} />
            <button
              onClick={onSetBudget}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
              title="Edit Budget Limit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Big Remaining / Spent values */}
        <div className="mb-4">
          <span className="text-xs text-slate-400">Remaining Balance</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                remainingAmount < 0 ? "text-rose-400" : "text-slate-100"
              }`}
            >
              {formatINR(remainingAmount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {formatINR(limitAmount)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">{percentUsed}% spent</span>
            <span className="text-slate-400">{formatINR(spentAmount)}</span>
          </div>
          <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()} shadow-md`}
              style={{ width: `${Math.min(snapshot.percentage_used, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {snapshot.status === "over_budget" && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Budget exceeded by {formatINR(Math.abs(remainingAmount))}</span>
        </div>
      )}
    </div>
  );
}
