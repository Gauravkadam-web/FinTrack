"use client";

import React, { useState } from "react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-slate-400 mb-2">
          📊
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Category Data</p>
        <p className="text-xs text-slate-400 mt-0.5">Add expenses to see breakdown</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category_name,
    value: Number(item.amount),
    percentage: item.percentage,
  }));

  const totalSpent = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const activeItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="w-full space-y-2">
      <div className="h-60 sm:h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0];
                  const item = p.payload as (typeof chartData)[0];
                  return (
                    <div className="glass-panel px-3 py-2 rounded-xl shadow-xl border border-border text-xs">
                      <div className="font-bold text-foreground mb-0.5">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600 dark:text-primary-400 font-extrabold">{formatINR(item.value)}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">({item.percentage}%)</span>
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
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PALETTE[index % PALETTE.length]}
                  stroke="transparent"
                  className="transition-all duration-200 cursor-pointer"
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.45}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Hole Summary */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {activeItem ? (
            <>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {activeItem.name}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-foreground">
                {formatINR(activeItem.value)}
              </span>
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                {activeItem.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                Total
              </span>
              <span className="text-sm sm:text-base font-extrabold text-foreground">
                {formatINR(totalSpent)}
              </span>
              <span className="text-[9px] text-slate-400">
                {chartData.length} {chartData.length === 1 ? "category" : "categories"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 ${
              hoveredIndex === index
                ? "bg-surface-200 border-primary/40 shadow-xs"
                : "bg-surface-100/70 border-border"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className="text-slate-700 dark:text-slate-200 truncate font-medium text-[11px]">{item.name}</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 ml-1 text-[10px]">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
