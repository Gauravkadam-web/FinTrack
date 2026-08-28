"use client";

import React from "react";
import { TiltCard } from "@/components/ui/TiltCard";
import { Budget } from "@/types";
import { formatINR } from "@/lib/utils";

interface BudgetListCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function BudgetListCard({ budget, onEdit, onDelete }: BudgetListCardProps) {
  const limit = Number(budget.limit_amount);
  const spent = Number(budget.spent);
  const remaining = Number(budget.remaining);
  const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, percentUsed));

  const getStatusDisplay = () => {
    switch (budget.status) {
      case "over_budget":
        return {
          label: "Over Budget",
          badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          barColor: "bg-gradient-to-r from-rose-500 to-rose-600",
        };
      case "near_limit":
        return {
          label: "Near Limit (≥80%)",
          badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
        };
      default:
        return {
          label: "On Track",
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
        };
    }
  };

  const status = getStatusDisplay();
  const isOverall = !budget.category_id;

  return (
    <TiltCard
      maxTilt={10}
      scaleOnHover={1.02}
      className="p-5 flex flex-col justify-between space-y-4"
    >
      {/* Top Row: Category Name & Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            style={{ transform: "translateZ(20px)" }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
              isOverall
                ? "bg-primary-500 text-white shadow-primary-500/30"
                : "bg-surface-100 text-primary-600 dark:text-primary-400 border border-border"
            }`}
          >
            {isOverall ? "🎯" : (budget.category_name || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ transform: "translateZ(28px)" }}>
              <h4 className="font-bold text-base text-foreground tracking-tight">
                {isOverall ? "Overall Monthly Budget" : budget.category_name}
              </h4>
              {isOverall && (
                <span
                  style={{ transform: "translateZ(50px)" }}
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                >
                  Global
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Period: {budget.period_month}
            </p>
          </div>
        </div>

        <div style={{ transform: "translateZ(50px)" }}>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.badgeClass}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Progress Bar & Percent */}
      <div className="space-y-1.5" style={{ transform: "translateZ(28px)" }}>
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Spent: {formatINR(spent)}</span>
          <span className="text-foreground font-bold">{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-surface-200 overflow-hidden p-0.5 border border-border">
          <div
            className={`h-full rounded-full ${status.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Limit & Remaining Row */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs" style={{ transform: "translateZ(32px)" }}>
        <div className="p-2 rounded-lg bg-surface-100/60 border border-border">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Budget Limit</span>
          <p className="font-bold text-sm text-foreground">{formatINR(limit)}</p>
        </div>
        <div className="p-2 rounded-lg bg-surface-100/60 border border-border">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Remaining</span>
          <p
            className={`font-bold text-sm ${
              remaining < 0
                ? "text-rose-500 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {formatINR(remaining)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1" style={{ transform: "translateZ(28px)" }}>
        <button
          onClick={() => onEdit(budget)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-100 hover:bg-surface-200 text-foreground border border-border transition-colors cursor-pointer"
        >
          Edit Limit
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          Remove
        </button>
      </div>
    </TiltCard>
  );
}
