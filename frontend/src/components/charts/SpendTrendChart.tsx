"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardTrendItem } from "@/types";
import { formatINR } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

interface SpendTrendChartProps {
  data: DashboardTrendItem[];
  granularity: "daily" | "weekly" | "monthly";
  onGranularityChange: (g: "daily" | "weekly" | "monthly") => void;
  isLoading?: boolean;
}

export function SpendTrendChart({
  data,
  granularity,
  onGranularityChange,
  isLoading,
}: SpendTrendChartProps) {
  const chartData = (data || []).map((d) => ({
    label: d.label,
    amount: Number(d.amount),
  }));

  const totalAmount = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  const granularityOptions = [
    { value: "daily" as const, label: "Daily" },
    { value: "weekly" as const, label: "Weekly" },
    { value: "monthly" as const, label: "Monthly" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header with Period Total and Segmented Timeframe Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Period Total</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{formatINR(totalAmount)}</p>
        </div>

        <div className="w-60 sm:w-auto">
          <SegmentedControl
            options={granularityOptions}
            value={granularity}
            onChange={onGranularityChange}
            size="sm"
          />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-surface-100 flex items-center justify-center text-slate-400 mb-1.5">
              📈
            </div>
            <span>No spending data available for this range</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendTrendGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="70%" stopColor="#06b6d4" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (granularity === "daily") {
                    const parts = value.split("-");
                    return parts.length === 3 ? parts[2] : value;
                  }
                  return value;
                }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0];
                    return (
                      <div className="glass-panel px-3 py-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                        <div className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">{p.payload.label}</div>
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {formatINR(Number(p.value))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendTrendGlow)"
                activeDot={{ r: 5, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
