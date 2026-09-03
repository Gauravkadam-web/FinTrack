"use client";

import React, { useState, useEffect } from "react";
import { SparklesIcon } from "@/components/ui/Icons";
import { getBudgetForecast } from "@/lib/api/ai";
import { AIBudgetForecastResponse } from "@/types";
import { formatINR } from "@/lib/utils";

export const BurnRateBadge: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [data, setData] = useState<AIBudgetForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getBudgetForecast()
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        // Silently omit if not configured or failed
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-xs text-slate-400 animate-pulse ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span>Calculating Pace...</span>
      </div>
    );
  }

  if (!data) return null;

  const isWarning = data.status === "warning";
  const isExceeded = data.status === "exceeded";

  const statusConfig = isExceeded
    ? {
        label: "Pacing Over Budget",
        badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
        dotColor: "bg-rose-500",
      }
    : isWarning
    ? {
        label: "Pacing High",
        badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
        dotColor: "bg-amber-500",
      }
    : {
        label: "Pace On Track",
        badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
        dotColor: "bg-emerald-500",
      };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition hover:opacity-90 ${statusConfig.badgeBg}`}
      >
        <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
        <span>{statusConfig.label}</span>
        <SparklesIcon size="xs" className="opacity-80" />
      </button>

      {/* Expanded Details Tooltip Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <SparklesIcon size="xs" className="text-primary-500" />
              AI Budget Forecast
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              &times;
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Daily Burn Rate:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatINR(Number(data.current_daily_burn))}/day
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Projected Month-end:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatINR(Number(data.projected_total_spent))}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Safe Daily Limit:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatINR(Number(data.recommended_daily_limit))}/day
              </span>
            </div>
          </div>

          {data.ai_advice && (
            <p className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &ldquo;{data.ai_advice}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
};
