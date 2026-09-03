"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@/components/ui/Icons";
import { parseExpenseText } from "@/lib/api/ai";
import { AIParsedExpenseResponse } from "@/types";

interface QuickAddBarProps {
  onParsedExpense: (data: AIParsedExpenseResponse) => void;
  className?: string;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onParsedExpense,
  className = "",
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+J / Cmd+J to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const parsed = await parseExpenseText({ prompt: trimmed });
      onParsedExpense(parsed);
      setPrompt("");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Could not parse expense statement. Please try again."
      );
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow ambient background on hover/focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300 pointer-events-none" />

        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden">
          {/* Left Sparkles Icon */}
          <div className="pl-4 pr-2 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <SparklesIcon size="md" className="text-primary-500 animate-pulse" />
              </motion.div>
            ) : (
              <SparklesIcon size="md" className="text-primary-600 dark:text-primary-400" />
            )}
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Quick Add with AI: 'Dinner with friends 850 cash yesterday' or 'Uber 240 upi'..."
            className="w-full py-3.5 px-2 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          {/* Right Action Button & Shortcut Badge */}
          <div className="pr-3 flex items-center space-x-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
              Ctrl+J
            </kbd>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Parse ✨</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error notification */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 px-3 py-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-center justify-between"
          >
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-slate-600 text-sm ml-2"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
