import React from "react";
import { cn } from "@/lib/utils";
import { BudgetStatus, PaymentMode } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "cyan" | "purple";
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
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          On Track
        </Badge>
      );
    case "near_limit":
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Near Limit
        </Badge>
      );
    case "over_budget":
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          Over Budget
        </Badge>
      );
    default:
      return null;
  }
}

export function PaymentModeBadge({ mode }: { mode?: PaymentMode | null }) {
  if (!mode) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const config = {
    upi: {
      label: "UPI",
      icon: "⚡",
      variant: "cyan" as const,
    },
    card: {
      label: "Card",
      icon: "💳",
      variant: "info" as const,
    },
    cash: {
      label: "Cash",
      icon: "💵",
      variant: "success" as const,
    },
    other: {
      label: "Other",
      icon: "🌐",
      variant: "neutral" as const,
    },
  };

  const item = config[mode] || config.other;

  return (
    <Badge variant={item.variant} className="gap-1 font-medium text-[11px] py-0.5">
      <span className="text-[10px]">{item.icon}</span>
      {item.label}
    </Badge>
  );
}
