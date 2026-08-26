import React from "react";
import { cn } from "@/lib/utils";
import { BudgetStatus } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-200 text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    info: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    neutral: "bg-slate-800 text-slate-400 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  switch (status) {
    case "on_track":
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          On Track
        </Badge>
      );
    case "near_limit":
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Near Limit
        </Badge>
      );
    case "over_budget":
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Over Budget
        </Badge>
      );
    default:
      return null;
  }
}
