"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
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
    <div className="glass-card rounded-2xl p-6 border border-slate-800/90 space-y-4 shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Top Categories</h3>
          <p className="text-xs text-slate-400">Ranked by monthly expenditure</p>
        </div>
        {onOpenCategoryManager && (
          <button
            onClick={onOpenCategoryManager}
            className="text-xs text-primary-400 hover:text-primary-300 font-semibold px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            Manage
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !topCategories || topCategories.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 mb-2">
            🏷️
          </div>
          <p className="text-xs font-semibold text-slate-300">No category transactions</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Recorded expenses will rank here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topCategories.items.map((cat, index) => {
            const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

            return (
              <div
                key={cat.category_id}
                className="p-3 rounded-xl bg-surface-50/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-surface-200 text-slate-300 font-bold flex items-center justify-center text-[10px] border border-slate-700">
                      #{cat.rank}
                    </span>
                    <span className="font-semibold text-slate-200">{cat.category_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{formatINR(cat.total_spent)}</span>
                    <span className="text-slate-400 font-medium text-[11px]">
                      ({cat.percentage_of_total}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
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
