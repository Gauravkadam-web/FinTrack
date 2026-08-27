"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BudgetOverviewCard } from "@/components/budget/BudgetOverviewCard";
import {
  DashboardSummaryResponse,
  DashboardComparisonResponse,
  AverageSpendResponse,
} from "@/types";

interface HeroMetricsSectionProps {
  summary?: DashboardSummaryResponse | null;
  comparison?: DashboardComparisonResponse | null;
  averageSpend?: AverageSpendResponse | null;
  isLoading?: boolean;
  onSetBudget: () => void;
}

export function HeroMetricsSection({
  summary,
  comparison,
  averageSpend,
  isLoading,
  onSetBudget,
}: HeroMetricsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 3 Primary Metric Cards */}
      <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Spent */}
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Total Spent
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary-400 flex items-center justify-center border border-primary/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatINR(summary?.total_spent)}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                <span className="text-slate-200 font-semibold">{summary?.expense_count || 0}</span>{" "}
                {summary?.expense_count === 1 ? "expense" : "expenses"} recorded
              </p>
            </div>
          </div>
        )}

        {/* 2. MoM Comparison */}
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Monthly Trend
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatINR(comparison?.difference)}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                {comparison?.percentage_change !== null && comparison?.percentage_change !== undefined ? (
                  Number(comparison.percentage_change) > 0 ? (
                    <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                      ↑ +{comparison.percentage_change}% vs last mo.
                    </span>
                  ) : Number(comparison.percentage_change) < 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      ↓ {comparison.percentage_change}% vs last mo.
                    </span>
                  ) : (
                    <span className="text-slate-400">0% change vs last mo.</span>
                  )
                ) : (
                  <span className="text-slate-500">No baseline data</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Daily Average */}
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Daily Average
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatINR(averageSpend?.average_amount)}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                Normalized run-rate / day
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Featured Budget Overview Card (4 to 5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4">
        <BudgetOverviewCard
          snapshot={summary?.budget_snapshot}
          onSetBudget={onSetBudget}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
