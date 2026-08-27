import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({
  className,
  showText = true,
  size = "md",
  href = "/dashboard",
}: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none shrink-0", className)}>
      {/* Geometric Fintech Emblem */}
      <div
        className={cn(
          "relative rounded-xl bg-gradient-to-br from-indigo-500 via-primary-500 to-cyan-400 p-[1.5px] shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0",
          iconSizes[size]
        )}
      >
        <div className="w-full h-full bg-surface-50 dark:bg-surface-100 rounded-[10.5px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-cyan-400/25" />

          {/* Minimalist Trend & Rupee Vector Mark */}
          <svg
            className="w-3/5 h-3/5 relative z-10 text-slate-800 dark:text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Trend line */}
            <path
              d="M3 17L8.5 11.5L12.5 15.5L20.5 7"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arrow head */}
            <path
              d="M15.5 7H20.5V12"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Currency top bar */}
            <path
              d="M4 6.5H10.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div
            className={cn(
              "font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5",
              textSizes[size]
            )}
          >
            <span>Fin</span>
            <span className="bg-gradient-to-r from-primary-600 to-cyan-500 dark:from-primary-400 dark:to-cyan-300 bg-clip-text text-transparent">
              Track
            </span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-1">
            Expense Tracker
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-flex">{content}</Link>;
  }

  return content;
}
