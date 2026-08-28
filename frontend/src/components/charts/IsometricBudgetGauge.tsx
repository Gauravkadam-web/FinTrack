"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface IsometricBudgetGaugeProps {
  percentage: number; // 0 to 100+
  size?: number; // default 140
  strokeWidth?: number; // 10-14px, default 12
  status?: "safe" | "warning" | "exceeded";
  label?: string;
  sublabel?: string;
}

export function IsometricBudgetGauge({
  percentage,
  size = 140,
  strokeWidth = 12,
  status = "safe",
  label,
  sublabel,
}: IsometricBudgetGaugeProps) {
  const shouldReduceMotion = useReducedMotion();
  const filterIdLift = useId();
  const filterIdGlow = useId();

  // Calculations for 140px SVG circle
  const center = size / 2;
  const radius = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Status colors
  const getColorClass = () => {
    switch (status) {
      case "exceeded":
        return "text-rose-500 stroke-rose-500";
      case "warning":
        return "text-amber-500 stroke-amber-500";
      default:
        return "text-emerald-500 stroke-emerald-500";
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{
          filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))",
        }}
      >
        <defs>
          {/* Lift Filter */}
          <filter id={filterIdLift} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity="0.5" />
          </filter>

          {/* Dynamic Glow Filter */}
          <filter id={filterIdGlow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="currentColor" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-black/10 dark:stroke-white/8"
        />

        {/* Dynamic Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: shouldReduceMotion ? 0.1 : 1.1,
            ease: [0.22, 1, 0.36, 1], // ease-out cubic
          }}
          className={`${getColorClass()} transition-colors duration-300`}
          style={{
            filter: `url(#${filterIdGlow})`,
          }}
        />
      </svg>

      {/* 3D Center Content with translateZ lift */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ transform: "translateZ(32px)" }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xl font-extrabold text-foreground tracking-tight"
        >
          {label !== undefined ? label : `${percentage.toFixed(0)}%`}
        </motion.span>
        {sublabel && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
