"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Listen for browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user dismissed recently (within 5 days)
      const dismissedTime = localStorage.getItem("fintrack_pwa_dismissed");
      if (dismissedTime) {
        const diffDays = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < 5) {
          return;
        }
      }

      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem("fintrack_pwa_dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("fintrack_pwa_dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 pointer-events-auto"
        >
          <div className="glass-card rounded-2xl p-4 border border-border shadow-2xl bg-surface-50/95 dark:bg-surface-100/95 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              {/* App Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-primary-500 to-cyan-400 p-[1.5px] shrink-0 shadow-md">
                <div className="w-full h-full bg-surface-50 dark:bg-surface-100 rounded-[10px] flex items-center justify-center overflow-hidden">
                  <svg
                    className="w-5 h-5 text-slate-800 dark:text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 17L8.5 11.5L12.5 15.5L20.5 7"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.5 7H20.5V12"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 6.5H10.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-foreground">Install FinTrack App</h4>
                  <span className="text-[9px] px-1.5 py-0.2 font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded-md">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Add to home screen for faster tracking & standalone experience.
                </p>
              </div>

              {/* Close / Dismiss */}
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-foreground rounded-lg transition-colors -mr-1 -mt-1 cursor-pointer"
                aria-label="Dismiss install banner"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-foreground transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Install</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
