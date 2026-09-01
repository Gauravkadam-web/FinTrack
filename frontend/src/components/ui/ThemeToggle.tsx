"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  iconOnly?: boolean;
  className?: string;
}

export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return iconOnly ? (
      <div className={cn("w-9 h-9 bg-surface-100 border border-border rounded-xl animate-pulse", className)} />
    ) : (
      <div className={cn("h-10 bg-surface-100 border border-border rounded-xl animate-pulse", className)} />
    );
  }

  const isDark = theme === "dark";

  if (iconOnly) {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface hover:bg-surface-100 border border-border text-foreground transition-all duration-200 cursor-pointer shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 select-none",
          className
        )}
        title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      >
        <motion.div
          key={theme}
          initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            // Sun Icon for Dark Mode
            <svg
              className="w-4 h-4 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            // Moon Icon for Light Mode
            <svg
              className="w-4 h-4 text-slate-700 dark:text-slate-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border transition-all duration-200 group cursor-pointer shadow-xs select-none",
        className
      )}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-surface-200 dark:bg-surface flex items-center justify-center shadow-inner">
          <motion.div
            key={theme}
            initial={{ scale: 0.6, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            {isDark ? (
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.div>
        </div>
        <span className="text-xs font-semibold text-foreground">
          {isDark ? "Dark Theme" : "Light Theme"}
        </span>
      </div>

      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-200 text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
