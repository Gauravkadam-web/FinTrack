"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkPasswordCriteria } from "@/lib/password-utils";

interface PasswordStrengthMeterProps {
  password?: string;
  showWhenEmpty?: boolean;
}

export function PasswordStrengthMeter({
  password = "",
  showWhenEmpty = false,
}: PasswordStrengthMeterProps) {
  if (!password && !showWhenEmpty) {
    return null;
  }

  const criteria = checkPasswordCriteria(password);

  const criteriaList = [
    { key: "length", label: "At least 8 characters", met: criteria.hasMinLength },
    { key: "upper", label: "Uppercase letter (A-Z)", met: criteria.hasUppercase },
    { key: "lower", label: "Lowercase letter (a-z)", met: criteria.hasLowercase },
    { key: "number", label: "Number digit (0-9)", met: criteria.hasNumber },
    { key: "special", label: "Special symbol (!@#$%...)", met: criteria.hasSpecial },
  ];

  return (
    <div className="space-y-2.5 pt-1.5 pb-1">
      {/* Strength Progress Header & Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            {criteria.score === 5 ? (
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            Strength:
          </span>
          <span className={`font-semibold text-xs ${criteria.textColorClass}`}>
            {password ? criteria.label : "Enter password"}
          </span>
        </div>

        {/* 5-Segment Dynamic Strength Bar */}
        <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4, 5].map((step) => {
            const isFilled = password.length > 0 && criteria.score >= step;
            return (
              <motion.div
                key={step}
                className={`h-full rounded-full transition-colors duration-300 ${
                  isFilled ? criteria.colorClass : "bg-slate-200 dark:bg-slate-700/60"
                }`}
                initial={false}
                animate={{ scale: isFilled ? 1 : 0.95 }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteriaList.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
              item.met
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                item.met
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-transparent border border-slate-300 dark:border-slate-700"
              }`}
            >
              <AnimatePresence>
                {item.met && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
