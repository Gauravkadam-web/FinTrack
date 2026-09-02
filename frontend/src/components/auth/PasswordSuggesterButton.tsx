"use client";

import React, { useState } from "react";
import { generateStrongPassword } from "@/lib/password-utils";

interface PasswordSuggesterButtonProps {
  onSuggest: (password: string) => void;
  className?: string;
}

export function PasswordSuggesterButton({
  onSuggest,
  className = "",
}: PasswordSuggesterButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newPassword = generateStrongPassword(16);
    onSuggest(newPassword);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(newPassword).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover active:scale-95 transition-all duration-150 cursor-pointer ${className}`}
      title="Generate and auto-fill a cryptographically strong password"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Copied & Auto-filled!
          </span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            Suggest Strong Password
          </span>
        </>
      )}
    </button>
  );
}
