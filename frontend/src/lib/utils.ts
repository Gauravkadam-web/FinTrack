import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numerical amount to INR string (e.g. ₹1,250.00).
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₹0.00";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date string to display readable format (e.g. "27 Aug 2026").
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format 'YYYY-MM' string to "August 2026".
 */
export function formatMonthYear(monthString: string): string {
  if (!monthString) return "";
  const [year, month] = monthString.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Get current month in 'YYYY-MM' format.
 */
export function getCurrentMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get today in 'YYYY-MM-DD' format.
 */
export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get payment mode display label & badge color.
 */
export function getPaymentModeBadge(mode?: string | null) {
  switch (mode) {
    case "upi":
      return { label: "UPI", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    case "card":
      return { label: "Card", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    case "cash":
      return { label: "Cash", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    default:
      return { label: "Other", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  }
}

/**
 * Trigger subtle mobile haptic feedback if supported.
 */
export function triggerHaptic(duration: number = 10): void {
  if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore errors if vibration is blocked by browser policy
    }
  }
}


