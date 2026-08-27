"use client";

import React from "react";
import { Category, ExpenseQueryParams, PaymentMode } from "@/types";

interface ActiveFilterChipsProps {
  filters: ExpenseQueryParams;
  categories: Category[];
  onRemoveFilter: (key: keyof ExpenseQueryParams) => void;
  onResetAll: () => void;
}

export function ActiveFilterChips({
  filters,
  categories,
  onRemoveFilter,
  onResetAll,
}: ActiveFilterChipsProps) {
  const chips: { key: keyof ExpenseQueryParams; label: string }[] = [];

  if (filters.search) {
    chips.push({ key: "search", label: `Search: "${filters.search}"` });
  }

  if (filters.category_id) {
    const cat = categories.find((c) => c.id === filters.category_id);
    chips.push({
      key: "category_id",
      label: `Category: ${cat ? cat.name : "Selected"}`,
    });
  }

  if (filters.payment_mode) {
    const modeLabels: Record<PaymentMode, string> = {
      upi: "UPI ⚡",
      card: "Card 💳",
      cash: "Cash 💵",
      other: "Other 🌐",
    };
    chips.push({
      key: "payment_mode",
      label: `Mode: ${modeLabels[filters.payment_mode] || filters.payment_mode}`,
    });
  }

  if (filters.date_from) {
    chips.push({ key: "date_from", label: `From: ${filters.date_from}` });
  }

  if (filters.date_to) {
    chips.push({ key: "date_to", label: `To: ${filters.date_to}` });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Filters:</span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary/15 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary/30 shadow-xs"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key)}
            className="w-3.5 h-3.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary/30 flex items-center justify-center transition-colors"
            title="Remove filter"
          >
            ×
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetAll}
        className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-auto"
      >
        Clear All
      </button>
    </div>
  );
}
