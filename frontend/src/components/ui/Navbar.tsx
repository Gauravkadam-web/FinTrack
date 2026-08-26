"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface NavbarProps {
  onOpenCategoryManager?: () => void;
  onOpenQuickAdd?: () => void;
}

export function Navbar({ onOpenCategoryManager, onOpenQuickAdd }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Expenses", href: "/expenses" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface-50 rounded-[11px] flex items-center justify-center">
              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-tr from-primary-400 to-cyan-300">
                ₹
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
              FinTrack
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary-300 border border-primary/30">
                V1
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              Personal Expense Tracker
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-100/60 p-1 rounded-xl border border-slate-800">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-lg transition-all relative",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-200/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {onOpenCategoryManager && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenCategoryManager}
              leftIcon={
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            >
              Categories
            </Button>
          )}

          {onOpenQuickAdd ? (
            <Button
              size="sm"
              onClick={onOpenQuickAdd}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Expense
            </Button>
          ) : (
            <Link href="/expenses/new">
              <Button
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Expense
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {onOpenQuickAdd ? (
            <Button size="sm" onClick={onOpenQuickAdd}>
              + Add
            </Button>
          ) : (
            <Link href="/expenses/new">
              <Button size="sm">+ Add</Button>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-100 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu slide down */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800 bg-surface-50/95 backdrop-blur-xl px-4 py-4 space-y-2 overflow-hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-base font-medium",
                  pathname === link.href
                    ? "bg-primary/20 text-primary-300 border border-primary/30"
                    : "text-slate-300 hover:bg-surface-100"
                )}
              >
                {link.name}
              </Link>
            ))}

            {onOpenCategoryManager && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCategoryManager();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-surface-100"
              >
                Manage Categories
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
