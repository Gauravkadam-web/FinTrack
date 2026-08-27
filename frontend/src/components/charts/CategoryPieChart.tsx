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
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 mb-2">
          📊
        </div>
        <p className="text-sm font-semibold text-slate-300">No Category Data</p>
        <p className="text-xs text-slate-500 mt-0.5">Add expenses to see category breakdown</p>
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
      <div className="h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0];
                  const item = p.payload as (typeof chartData)[0];
                  return (
                    <div className="glass-panel px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700/80 text-xs">
                      <div className="font-bold text-white mb-0.5">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary-300 font-extrabold">{formatINR(item.value)}</span>
                        <span className="text-slate-400 font-medium">({item.percentage}%)</span>
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
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PALETTE[index % PALETTE.length]}
                  stroke="#080b11"
                  strokeWidth={2.5}
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
              <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
                {activeItem.name}
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatINR(activeItem.value)}
              </span>
              <span className="text-[10px] font-bold text-primary-300">
                {activeItem.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Total
              </span>
              <span className="text-base font-extrabold text-white">
                {formatINR(totalSpent)}
              </span>
              <span className="text-[10px] text-slate-500">
                {chartData.length} {chartData.length === 1 ? "category" : "categories"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
              hoveredIndex === index
                ? "bg-surface-200 border-primary/40 shadow-sm"
                : "bg-surface-50/70 border-slate-800/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className="text-slate-200 truncate font-medium">{item.name}</span>
            </div>
            <span className="text-slate-400 font-bold shrink-0 ml-1.5 text-[11px]">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
