"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BudgetOverviewCard } from "@/components/budget/BudgetOverviewCard";
import { TiltCard } from "@/components/ui/TiltCard";
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Spent Card */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <TiltCard maxTilt={8} scaleOnHover={1.02} className="h-full">
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-border h-full bg-surface-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Total Spent
              </span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary/20">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="my-1">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                {formatINR(summary?.total_spent)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">{summary?.expense_count || 0}</span>{" "}
                {summary?.expense_count === 1 ? "expense" : "expenses"}
              </p>
            </div>
          </div>
        </TiltCard>
      )}

      {/* 2. MoM Trend Card */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <TiltCard maxTilt={8} scaleOnHover={1.02} className="h-full">
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-border h-full bg-surface-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Monthly Trend
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="my-1">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                {formatINR(comparison?.difference)}
              </div>

              <div className="mt-0.5 text-[11px] font-semibold truncate">
                {comparison?.percentage_change !== null && comparison?.percentage_change !== undefined ? (
                  Number(comparison.percentage_change) > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      ↑ +{comparison.percentage_change}% vs last mo.
                    </span>
                  ) : Number(comparison.percentage_change) < 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ↓ {comparison.percentage_change}% vs last mo.
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">0% vs last mo.</span>
                  )
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">No baseline</span>
                )}
              </div>
            </div>
          </div>
        </TiltCard>
      )}

      {/* 3. Daily Average Card */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <TiltCard maxTilt={8} scaleOnHover={1.02} className="h-full">
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-border h-full bg-surface-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Daily Average
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="my-1">
              <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                {formatINR(averageSpend?.average_amount)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                Normalized / day
              </p>
            </div>
          </div>
        </TiltCard>
      )}

      {/* 4. Budget Card */}
      <BudgetOverviewCard
        snapshot={summary?.budget_snapshot}
        onSetBudget={onSetBudget}
        isLoading={isLoading}
      />
    </div>
  );
}
