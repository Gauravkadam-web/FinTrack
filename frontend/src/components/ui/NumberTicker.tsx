"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { formatINR } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  className = "",
  isCurrency = true,
  prefix = "",
  suffix = "",
  decimalPlaces = 2,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 24,
    mass: 0.8,
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      if (ref.current) {
        ref.current.textContent = isCurrency
          ? `${prefix}${formatINR(value)}${suffix}`
          : `${prefix}${value.toLocaleString("en-IN", {
              minimumFractionDigits: decimalPlaces,
              maximumFractionDigits: decimalPlaces,
            })}${suffix}`;
      }
      return;
    }

    motionValue.set(value);
  }, [value, motionValue, prefersReducedMotion, isCurrency, prefix, suffix, decimalPlaces]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    return springValue.on("change", (latest) => {
      if (ref.current) {
        if (isCurrency) {
          ref.current.textContent = `${prefix}${formatINR(latest)}${suffix}`;
        } else {
          ref.current.textContent = `${prefix}${latest.toLocaleString("en-IN", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          })}${suffix}`;
        }
      }
    });
  }, [springValue, isCurrency, prefix, suffix, decimalPlaces, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <span className={className}>
        {isCurrency
          ? `${prefix}${formatINR(value)}${suffix}`
          : `${prefix}${value.toLocaleString("en-IN", {
              minimumFractionDigits: decimalPlaces,
              maximumFractionDigits: decimalPlaces,
            })}${suffix}`}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {isCurrency ? `${prefix}${formatINR(value)}${suffix}` : `${prefix}${value}${suffix}`}
    </span>
  );
}
