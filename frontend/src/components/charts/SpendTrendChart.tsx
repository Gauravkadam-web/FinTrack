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

  return (
    <div className="w-full space-y-4">
      {/* Granularity selector tabs & quick stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 font-medium">Period Total</span>
          <p className="text-lg font-bold text-slate-100">{formatINR(totalAmount)}</p>
        </div>

        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-800">
          {(["daily", "weekly", "monthly"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                granularity === g
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-72 w-full relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            No spending data available for this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (granularity === "daily") {
                    // Extract DD from YYYY-MM-DD
                    const parts = value.split("-");
                    return parts.length === 3 ? parts[2] : value;
                  }
                  return value;
                }}
              />
              <YAxis
                stroke="#64748b"
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
                      <div className="glass-panel px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 text-xs">
                        <div className="text-slate-400 mb-0.5">{p.payload.label}</div>
                        <div className="text-base font-bold text-slate-100">
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
                stroke="#818cf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendGradient)"
                activeDot={{ r: 5, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
