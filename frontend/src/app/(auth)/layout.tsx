"use client";

import React from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased selection:bg-primary/30 selection:text-primary-600">
      {/* Top Header with Compact Theme Toggle */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto py-2">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle iconOnly className="w-10 h-10 shadow-xs" />
        </div>
      </header>

      {/* Main Centered Card Container */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="w-full max-w-md bg-surface border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/50 p-6 sm:p-8 backdrop-blur-xl">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-600 max-w-5xl w-full mx-auto py-2">
        FinTrack &bull; Secure Personal Expense Intelligence &bull; V2.0
      </footer>
    </div>
  );
}
