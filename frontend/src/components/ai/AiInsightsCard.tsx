"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, LightbulbIcon } from "@/components/ui/Icons";
import { getAiInsights } from "@/lib/api/ai";
import { AIInsightsResponse } from "@/types";

export const AiInsightsCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [data, setData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAiInsights("month");
      setData(res);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "AI Insights currently unavailable. Set AI_API_KEY in backend/.env to activate."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-primary-50/30 dark:from-slate-900 dark:via-slate-900/80 dark:to-primary-950/20 shadow-xs ${className}`}
    >
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <SparklesIcon size="sm" className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>AI Financial Health Check</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personalized monthly trends & smart spending tips
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          title="Refresh Insights"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-2.5 py-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : errorMsg ? (
        <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={fetchInsights}
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline shrink-0 ml-2"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Headline */}
          <div className="px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {data.headline}
            </p>
          </div>

          {/* 3 Digestible Bullets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {data.insights.map((item, idx) => {
              const isHighlight = item.type === "highlight";
              const isWatchout = item.type === "watchout";

              const badgeColor = isHighlight
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : isWatchout
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";

              const cardBg = isHighlight
                ? "border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                : isWatchout
                ? "border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10"
                : "border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10";

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`p-3 rounded-xl border ${cardBg} flex flex-col justify-between`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${badgeColor}`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
