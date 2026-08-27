"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenCategoryManager?: () => void;
  onOpenQuickAdd?: () => void;
}

export function Sidebar({ onOpenCategoryManager, onOpenQuickAdd }: SidebarProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      name: "Expenses Explorer",
      href: "/expenses",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 select-none">
      {/* Top Section: Brand & Nav Links */}
      <div className="space-y-7">
        {/* Brand Logo */}
        <div className="px-2 pt-1 pb-2 border-b border-slate-800/80">
          <Logo size="md" />
        </div>

        {/* Action Button: Quick Record Expense */}
        <div className="px-1">
          {onOpenQuickAdd ? (
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                onOpenQuickAdd();
              }}
              className="w-full group relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Record Expense</span>
            </button>
          ) : (
            <Link
              href="/expenses/new"
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full group relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Record Expense</span>
            </Link>
          )}
        </div>

        {/* Navigation Group */}
        <div className="space-y-1.5">
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <nav className="space-y-1 mt-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all relative",
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-100/70"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-primary-600/25 to-indigo-600/15 border border-primary/40 rounded-xl shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={cn("shrink-0", isActive ? "text-primary-400" : "text-slate-400")}>
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Management Group */}
        {onOpenCategoryManager && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Management
            </span>
            <div className="mt-2">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenCategoryManager();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-100/70 transition-all text-left"
              >
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Categories</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Status Pill */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-100/60 border border-slate-800/70">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">System Ready</span>
            <span className="text-[10px] text-slate-400">Supabase DB Connected</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Vertical Sidebar (>= lg) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-surface-50/95 backdrop-blur-2xl border-r border-slate-800/80 z-30 shadow-2xl shadow-black/40">
        {sidebarContent}
      </aside>

      {/* 2. Mobile / Tablet Top Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-slate-800/80 bg-surface-50/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          {onOpenQuickAdd ? (
            <button
              onClick={onOpenQuickAdd}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </button>
          ) : (
            <Link
              href="/expenses/new"
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </Link>
          )}

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-surface-100 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Open Navigation Drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* 3. Mobile Slide-out Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative w-72 max-w-[80vw] h-full bg-surface-50 border-r border-slate-800 shadow-2xl flex flex-col z-10"
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-surface-100 text-slate-400 hover:text-white border border-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
