"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenCategoryManager?: () => void;
  onOpenQuickAdd?: () => void;
}

export function Sidebar({ onOpenCategoryManager, onOpenQuickAdd }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, logoutAll } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
    {
      name: "Budgets & Targets",
      href: "/budgets",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Categories Hub",
      href: "/categories",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none bg-surface-50 text-foreground">
      {/* Top Section: Brand & Nav Links */}
      <div className="space-y-5">
        {/* Brand Logo */}
        <div className="px-2 pt-1 pb-3 border-b border-border">
          <Logo size="md" />
        </div>

        {/* Global Quick Action: Add Expense */}
        {onOpenQuickAdd && (
          <button
            onClick={() => {
              if (isMobile) setMobileDrawerOpen(false);
              onOpenQuickAdd();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Record Expense</span>
            </div>
            {!isMobile && (
              <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-white/90">
                N
              </kbd>
            )}
          </button>
        )}

        {/* Navigation Group */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <nav className="space-y-1 mt-1.5">
            {navLinks.map((link, idx) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group",
                    isActive
                      ? "text-primary-600 dark:text-white font-bold bg-primary-50 dark:bg-surface-100 border border-primary-200 dark:border-border shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400")}>
                      {link.icon}
                    </span>
                    <span>{link.name}</span>
                  </div>
                  {!isMobile && (
                    <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-surface-100 dark:bg-surface-200/50 group-hover:bg-surface-200 px-1.5 py-0.5 rounded border border-border/60">
                      {idx + 1}
                    </kbd>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: User Profile Menu & Theme Toggle */}
      <div className="space-y-3 pt-3 border-t border-border">
        {/* User Profile Card & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 border border-border transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {getInitials(user?.display_name)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {user?.display_name || "Authenticated User"}
                  </span>
                  {user?.auth_provider === "google" && (
                    <span className="text-[9px] px-1 py-0.2 bg-blue-500/10 text-blue-500 font-semibold rounded">
                      Google
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.email || "user@fintrack.app"}
                </span>
              </div>
            </div>

            <svg
              className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", userMenuOpen && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Menu Popup */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-surface border border-border rounded-xl shadow-xl z-50 space-y-1 backdrop-blur-xl"
              >
                {user?.auth_provider === "local" && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Change Password</span>
                  </button>
                )}

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logoutAll();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Sign Out All Devices</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 1-Click Light/Dark Toggle */}
        <div className="space-y-1">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Appearance
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* In-App Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
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

        {/* Right side controls: Theme Toggle on the LEFT of the Hamburger button */}
        <div className="flex items-center gap-2">
          <ThemeToggle iconOnly />

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
