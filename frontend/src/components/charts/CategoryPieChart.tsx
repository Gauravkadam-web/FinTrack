"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CategoryBreakdownItem } from "@/types";
import { formatINR } from "@/lib/utils";

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  isLoading?: boolean;
}

const PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#f43f5e", // Rose
  "#14b8a6", // Teal
];

export function CategoryPieChart({ data, isLoading }: CategoryPieChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-4 border-slate-800 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">No Category Data</p>
        <p className="text-xs text-slate-500 mt-0.5">Add expenses to see category breakdown</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category_name,
    value: Number(item.amount),
    percentage: item.percentage,
  }));

  return (
    <div className="w-full">
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0];
                  const item = p.payload as (typeof chartData)[0];
                  return (
                    <div className="glass-panel px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 text-xs">
                      <div className="font-semibold text-slate-100 mb-0.5">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary-300 font-bold">{formatINR(item.value)}</span>
                        <span className="text-slate-400">({item.percentage}%)</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PALETTE[index % PALETTE.length]}
                  stroke="#0a0d14"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 mt-2 max-h-36 overflow-y-auto pr-1">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-1.5 rounded-lg bg-surface-50/50 border border-slate-800/60 text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className="text-slate-300 truncate font-medium">{item.name}</span>
            </div>
            <span className="text-slate-400 font-semibold shrink-0 ml-1.5">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
