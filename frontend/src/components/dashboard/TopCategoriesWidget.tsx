"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { getCategoryVisuals, TagIcon } from "@/components/ui/Icons";
import { TopCategoriesResponse } from "@/types";

interface TopCategoriesWidgetProps {
  topCategories?: TopCategoriesResponse | null;
  isLoading?: boolean;
  onOpenCategoryManager?: () => void;
}

const CATEGORY_GRADIENTS = [
  "from-indigo-500 to-cyan-400",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-red-400",
];

export function TopCategoriesWidget({
  topCategories,
  isLoading,
  onOpenCategoryManager,
}: TopCategoriesWidgetProps) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-border space-y-3.5 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Top Categories</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Ranked by monthly spend</p>
        </div>
        {onOpenCategoryManager && (
          <button
            onClick={onOpenCategoryManager}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500 font-semibold px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary/10 transition-colors"
          >
            Manage
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2.5 py-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !topCategories || topCategories.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center text-slate-400 mb-2 border border-border shadow-xs">
            <TagIcon size="md" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No category data</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Expenses will rank here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {topCategories.items.map((cat, index) => {
            const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
            const visuals = getCategoryVisuals(cat.category_name);
            const IconComp = visuals.icon;

            return (
              <div
                key={cat.category_id}
                className="p-2.5 rounded-xl bg-surface-100/60 border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 rounded-md bg-surface-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[9px] border border-border shrink-0">
                      #{cat.rank}
                    </span>
                    <span className={`w-5 h-5 rounded-md ${visuals.bgLight} ${visuals.color} flex items-center justify-center shrink-0`}>
                      <IconComp size="xs" />
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.category_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-foreground">{formatINR(cat.total_spent)}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">
                      ({cat.percentage_of_total}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-1 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(cat.percentage_of_total, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
