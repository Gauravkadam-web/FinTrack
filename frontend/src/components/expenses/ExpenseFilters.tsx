"use client";

import React, { useState } from "react";
import { Category, ExpenseQueryParams, PaymentMode } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";
import { ActiveFilterChips } from "./ActiveFilterChips";

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Calculate number of active filters
  const activeCount = [
    Boolean(filters.search),
    Boolean(filters.category_id),
    Boolean(filters.payment_mode),
    Boolean(filters.date_from),
    Boolean(filters.date_to),
  ].filter(Boolean).length;

  const handleRemoveSingleFilter = (key: keyof ExpenseQueryParams) => {
    onFilterChange({ [key]: undefined });
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Top Search bar, Sort & Filter Drawer Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
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
            rightIcon={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: undefined })}
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-surface-200/80 hover:bg-surface-300 text-slate-500 hover:text-foreground flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search text"
                >
                  <CloseIcon size="xs" />
                </button>
              ) : null
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
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </Select>
        </div>

        {/* Sort Order & Advanced Filter Toggle */}
        <div className="sm:col-span-3 flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={filters.sort_order || "desc"}
              onChange={(e) =>
                onFilterChange({
                  sort_order: e.target.value as "asc" | "desc",
                })
              }
            >
              <option value="desc">Descending ↓</option>
              <option value="asc">Ascending ↑</option>
            </Select>
          </div>

          <Button
            type="button"
            variant={isAdvancedOpen ? "primary" : "secondary"}
            size="md"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="px-3"
            title="Toggle Advanced Filters"
            aria-label="Toggle Advanced Filters"
            aria-expanded={isAdvancedOpen}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-extrabold text-[10px] flex items-center justify-center -mr-1">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Collapsible Filter Drawer */}
      {isAdvancedOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border animate-slide-down">
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
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
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
            <option value="">All Modes</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
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
      )}

      {/* Active Filter Chips Bar */}
      <ActiveFilterChips
        filters={filters}
        categories={categories}
        onRemoveFilter={handleRemoveSingleFilter}
        onResetAll={onReset}
      />
    </div>
  );
}
