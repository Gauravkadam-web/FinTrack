"use client";

import React from "react";
import Link from "next/link";
import { TiltCard } from "@/components/ui/TiltCard";
import { getCategoryVisuals } from "@/components/ui/Icons";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isSystem = category.is_system;
  const visuals = getCategoryVisuals(category.name);
  const IconComponent = visuals.icon;

  return (
    <TiltCard
      maxTilt={10}
      scaleOnHover={1.02}
      className="p-5 flex flex-col justify-between space-y-4"
    >
      {/* Top Header & Avatar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            style={{ transform: "translateZ(20px)" }}
            className={`w-11 h-11 rounded-xl ${visuals.bgLight} border ${visuals.borderLight} flex items-center justify-center ${visuals.color} shadow-xs`}
          >
            <IconComponent size="lg" />
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ transform: "translateZ(28px)" }}>
              <h3 className="font-bold text-base text-foreground tracking-tight">
                {category.name}
              </h3>
              {isSystem && (
                <span
                  style={{ transform: "translateZ(50px)" }}
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-200 text-slate-500 dark:text-slate-400 border border-border"
                >
                  System Protected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {category.expense_count} {category.expense_count === 1 ? "expense" : "expenses"} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Info & Explorer Link */}
      <div className="pt-2 border-t border-border flex items-center justify-between" style={{ transform: "translateZ(28px)" }}>
        <Link
          href={`/expenses?category_id=${encodeURIComponent(category.id)}`}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px] py-1"
        >
          <span>View Expenses</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Action Buttons (Rename / Delete) */}
        {!isSystem ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(category)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-foreground hover:bg-surface-100 transition-colors cursor-pointer"
              title="Rename Category"
              aria-label={`Rename ${category.name}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            <button
              onClick={() => onDelete(category)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete Category"
              aria-label={`Delete ${category.name}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">Default Category</span>
        )}
      </div>
    </TiltCard>
  );
}
