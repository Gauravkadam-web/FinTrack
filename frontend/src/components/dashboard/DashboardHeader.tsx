"use client";

import React from "react";
import { formatMonthYear } from "@/lib/utils";

interface DashboardHeaderProps {
  month: string;
  onMonthChange: (newMonth: string) => void;
  onQuickAdd?: () => void;
}

export function DashboardHeader({
  month,
  onMonthChange,
  onQuickAdd,
}: DashboardHeaderProps) {
  const handlePrevMonth = () => {
    const [yearStr, monthStr] = month.split("-");
    let year = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) - 1;
    if (m < 1) {
      m = 12;
      year -= 1;
    }
    const formattedMonth = `${year}-${String(m).padStart(2, "0")}`;
    onMonthChange(formattedMonth);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = month.split("-");
    let year = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) + 1;
    if (m > 12) {
      m = 1;
      year += 1;
    }
    const formattedMonth = `${year}-${String(m).padStart(2, "0")}`;
    onMonthChange(formattedMonth);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Financial Overview
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Analytics for{" "}
          <span className="text-primary-300 font-semibold">{formatMonthYear(month)}</span>
        </p>
      </div>

      {/* Month Navigator Stepper */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-surface-100/90 border border-slate-800 rounded-xl p-0.5 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1">
            <svg className="w-3.5 h-3.5 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="month"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {onQuickAdd && (
          <button
            onClick={onQuickAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-semibold text-xs shadow-sm shadow-primary/25 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Expense</span>
          </button>
        )}
      </div>
    </div>
  );
}
