"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleanDigit = rawVal.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits.map((d) => (d === " " ? "" : d))];
    newDigits[index] = cleanDigit;
    const newOtp = newDigits.join("");
    onChange(newOtp);

    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIdx(index + 1);
    }

    if (newOtp.length === length && !newOtp.includes(" ") && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] || digits[index] === " ") {
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          setActiveIdx(index - 1);
        }
      } else {
        const newDigits = [...digits.map((d) => (d === " " ? "" : d))];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setActiveIdx(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setActiveIdx(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const focusTarget = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
    setActiveIdx(focusTarget);

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <motion.div
      animate={hasError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center gap-2 sm:gap-3 my-4"
    >
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] !== " " ? digits[index] : "";
        const isFilled = Boolean(char);
        const isFocused = activeIdx === index;

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => setActiveIdx(index)}
            onPaste={handlePaste}
            className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-2xl font-bold rounded-xl transition-all duration-200 outline-none
              bg-surface-primary dark:bg-surface-primary-dark
              border-2
              ${
                hasError
                  ? "border-danger-500 text-danger-500 focus:ring-4 focus:ring-danger-500/20"
                  : isFocused
                  ? "border-primary-500 ring-4 ring-primary-500/15 text-primary-600 dark:text-primary-400"
                  : isFilled
                  ? "border-surface-subtle dark:border-surface-subtle-dark text-text-primary dark:text-text-primary-dark"
                  : "border-surface-subtle dark:border-surface-subtle-dark text-text-muted"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label={`Digit ${index + 1} of verification code`}
          />
        );
      })}
    </motion.div>
  );
};
