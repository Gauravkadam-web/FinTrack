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
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-3 group select-none", className)}>
      {/* Geometric Fintech Emblem */}
      <div
        className={cn(
          "relative rounded-xl bg-gradient-to-br from-indigo-500 via-primary-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 group-hover:scale-105 transition-all duration-300",
          iconSizes[size]
        )}
      >
        <div className="w-full h-full bg-surface-50 rounded-[10.5px] flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-transparent to-cyan-400/20" />

          {/* Minimalist Trend & Rupee Vector Mark */}
          <svg
            className="w-3/5 h-3/5 relative z-10 drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Trend / Chart path */}
            <path
              d="M3 17L8.5 11.5L12.5 15.5L20.5 7"
              stroke="url(#logo-grad-1)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Upward arrow head */}
            <path
              d="M15.5 7H20.5V12"
              stroke="url(#logo-grad-1)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Rupee horizontal accents */}
            <path
              d="M4 6.5H10.5"
              stroke="#e0e7ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <defs>
              <linearGradient id="logo-grad-1" x1="3" y1="17" x2="20.5" y2="7" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818cf8" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-extrabold tracking-tight text-white flex items-center leading-none",
              textSizes[size]
            )}
          >
            <span>Fin</span>
            <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Track
            </span>
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 mt-1">
            Expense Intelligence
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
