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
      <div className="w-9 h-9 bg-surface-100 rounded-xl animate-pulse" />
    ) : (
      <div className="h-9 bg-surface-100 rounded-xl animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  if (iconOnly) {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 border border-border text-foreground transition-all duration-200 cursor-pointer shadow-xs select-none",
          className
        )}
        title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      >
        <motion.span
          key={theme}
          initial={{ scale: 0.5, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="text-base leading-none"
        >
          {isDark ? "☀️" : "🌙"}
        </motion.span>
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
        <div className="w-6 h-6 rounded-lg bg-surface-200 flex items-center justify-center text-sm shadow-inner">
          <motion.span
            key={theme}
            initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {isDark ? "🌙" : "☀️"}
          </motion.span>
        </div>
        <span className="text-xs font-semibold text-foreground">
          {isDark ? "Dark Theme" : "Light Theme"}
        </span>
      </div>

      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-200 text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {isDark ? "Switch to ☀️" : "Switch to 🌙"}
      </span>
    </button>
  );
}
