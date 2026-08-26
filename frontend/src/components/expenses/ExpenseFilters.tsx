"use client";

import React from "react";
import { Category, ExpenseQueryParams, PaymentMode } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ExpenseFiltersProps {
  filters: ExpenseQueryParams;
  categories: Category[];
  onFilterChange: (newFilters: Partial<ExpenseQueryParams>) => void;
  onReset: () => void;
}

export function ExpenseFilters({
  filters,
  categories,
  onFilterChange,
  onReset,
}: ExpenseFiltersProps) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-800">
      {/* Top Search bar and Sort row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6">
          <Input
            placeholder="Search by title or notes..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            leftIcon={
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Sort By */}
        <div className="sm:col-span-3">
          <Select
            value={filters.sort_by || "date"}
            onChange={(e) =>
              onFilterChange({
                sort_by: e.target.value as "amount" | "date" | "category",
              })
            }
          >
            <option value="date" className="bg-surface-100">Sort by Date</option>
            <option value="amount" className="bg-surface-100">Sort by Amount</option>
            <option value="category" className="bg-surface-100">Sort by Category</option>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="sm:col-span-3">
          <Select
            value={filters.sort_order || "desc"}
            onChange={(e) =>
              onFilterChange({
                sort_order: e.target.value as "asc" | "desc",
              })
            }
          >
            <option value="desc" className="bg-surface-100">Descending (Newest / High)</option>
            <option value="asc" className="bg-surface-100">Ascending (Oldest / Low)</option>
          </Select>
        </div>
      </div>

      {/* Filter Row: Category, Payment Mode, Date range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
        {/* Category filter */}
        <Select
          label="Category"
          value={filters.category_id || ""}
          onChange={(e) =>
            onFilterChange({
              category_id: e.target.value ? e.target.value : undefined,
            })
          }
        >
          <option value="" className="bg-surface-100">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-surface-100">
              {cat.name}
            </option>
          ))}
        </Select>

        {/* Payment mode filter */}
        <Select
          label="Payment Mode"
          value={filters.payment_mode || ""}
          onChange={(e) =>
            onFilterChange({
              payment_mode: e.target.value ? (e.target.value as PaymentMode) : undefined,
            })
          }
        >
          <option value="" className="bg-surface-100">All Modes</option>
          <option value="upi" className="bg-surface-100">UPI</option>
          <option value="card" className="bg-surface-100">Card</option>
          <option value="cash" className="bg-surface-100">Cash</option>
          <option value="other" className="bg-surface-100">Other</option>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          label="From Date"
          value={filters.date_from || ""}
          onChange={(e) =>
            onFilterChange({
              date_from: e.target.value ? e.target.value : undefined,
            })
          }
        />

        {/* Date To */}
        <Input
          type="date"
          label="To Date"
          value={filters.date_to || ""}
          onChange={(e) =>
            onFilterChange({
              date_to: e.target.value ? e.target.value : undefined,
            })
          }
        />
      </div>

      {/* Reset action button */}
      <div className="flex justify-end pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-200"
          leftIcon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
