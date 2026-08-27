"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenCategoryManager?: () => void;
  onOpenQuickAdd?: () => void;
}

export function Sidebar({ onOpenCategoryManager }: SidebarProps) {
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

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none bg-surface-50 text-foreground">
      {/* Top Section: Brand & Nav Links */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-2 pt-1 pb-3 border-b border-border">
          <Logo size="md" />
        </div>

        {/* Navigation Group */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </span>
          <nav className="space-y-1 mt-1.5">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative",
                    isActive
                      ? "text-primary-600 dark:text-white font-bold bg-primary-50 dark:bg-surface-100 border border-primary-200 dark:border-border shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-100"
                  )}
                >
                  <span className={cn("shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400")}>
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
          <div className="space-y-1 pt-3 border-t border-border">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Settings
            </span>
            <div className="mt-1.5">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenCategoryManager();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-100 transition-all text-left"
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

      {/* Bottom Section: Theme Toggle (Desktop only) & Status Pill */}
      <div className="space-y-3 pt-3 border-t border-border">
        {/* 1-Click Light/Dark Toggle (Desktop only) */}
        {!isMobile && (
          <div className="space-y-1">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Appearance
            </span>
            <ThemeToggle />
          </div>
        )}

        {/* Database Status Indicator */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-100 border border-border">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-foreground">Database Connected</span>
            <span className="text-[9px] text-slate-400">Supabase Managed</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Vertical Sidebar (>= lg) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-surface-50 border-r border-border z-30 shadow-xl transition-colors duration-200">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile / Tablet Top Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-border bg-surface-50/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between transition-colors duration-200">
        <Logo size="sm" />

        {/* Right side controls: Hamburger Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 border border-border text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* 3. Mobile Slide-out Drawer (Opens from RIGHT) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-xs"
            />

            {/* Drawer panel (Anchored to Right) */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="relative w-72 max-w-[80vw] h-full bg-surface-50 border-l border-border shadow-2xl flex flex-col z-10"
            >
              {/* Close Button on Top Right of Drawer */}
              <div className="absolute top-3.5 right-3.5 z-20">
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-surface-100 text-slate-500 dark:text-slate-400 hover:text-foreground border border-border transition-colors cursor-pointer"
                  aria-label="Close Navigation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
