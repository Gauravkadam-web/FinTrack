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
      <div className="glass-card rounded-2xl p-6 animate-pulse space-y-4 h-full flex flex-col justify-between border border-slate-800">
        <div className="h-4 w-32 bg-surface-200 rounded" />
        <div className="h-8 w-44 bg-surface-200 rounded" />
        <div className="h-3 w-full bg-surface-200 rounded" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="glass-card rounded-2xl p-6 border-dashed border-slate-800 flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Monthly Budget Target
            </span>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-surface-100 border border-slate-800">
              Not Configured
            </span>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-200 mb-1">
              Set Your Spending Limit
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track monthly spending against a target limit and get automated threshold alerts.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onSetBudget}
            className="w-full sm:w-auto"
            leftIcon={
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Set Monthly Budget
          </Button>
        </div>
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
        return "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/30";
      case "near_limit":
        return "bg-gradient-to-r from-amber-500 to-orange-400 shadow-amber-500/30";
      case "over_budget":
        return "bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-500/30";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden border border-slate-800/90 shadow-xl">
      {/* Background soft ambient tint based on status */}
      {snapshot.status === "over_budget" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -z-10" />
      )}
      {snapshot.status === "on_track" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
            Monthly Budget Goal
          </span>
          <div className="flex items-center gap-2">
            <BudgetStatusBadge status={snapshot.status} />
            <button
              onClick={onSetBudget}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
              title="Edit Budget Limit"
              aria-label="Edit Budget Limit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Big Remaining / Spent values */}
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-400">Remaining Balance</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                remainingAmount < 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {formatINR(remainingAmount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {formatINR(limitAmount)} target
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">{percentUsed}% spent</span>
            <span className="text-slate-400 font-medium">{formatINR(spentAmount)}</span>
          </div>
          <div className="w-full h-2.5 bg-surface-200 rounded-full overflow-hidden p-[2px] border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressColor()} shadow-md`}
              style={{ width: `${Math.min(snapshot.percentage_used, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {snapshot.status === "over_budget" && (
        <div className="mt-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Exceeded by {formatINR(Math.abs(remainingAmount))}</span>
        </div>
      )}
    </div>
  );
}
