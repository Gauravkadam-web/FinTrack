import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

export const UpiIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const CardIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </svg>
);

export const CashIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

export const OtherPaymentIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

/* Category Icons */
export const FoodIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M18 2v8a3 3 0 0 1-3 3h-1v9h-2V13h-1a3 3 0 0 1-3-3V2" />
    <path d="M18 2v4a2 2 0 0 1-2 2h-4" />
    <path d="M8 2v8" />
    <path d="M14 2v8" />
    <path d="M21 15v7h-2v-7a2 2 0 0 1 2-2z" />
  </svg>
);

export const TransportIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <rect x="3" y="4" width="18" height="12" rx="3" />
    <path d="M6 16v3M18 16v3" />
    <circle cx="7.5" cy="11.5" r="1.5" />
    <circle cx="16.5" cy="11.5" r="1.5" />
    <path d="M3 9h18" />
  </svg>
);

export const RentIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
  </svg>
);

export const UtilitiesIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" />
  </svg>
);

export const EntertainmentIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <path d="M6 12h4M8 10v4" />
    <circle cx="15" cy="11" r="1" />
    <circle cx="17" cy="13" r="1" />
  </svg>
);

export const ShoppingIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export const HealthcareIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const EducationIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export const GroceriesIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
  </svg>
);

export const InvestmentIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

export const UncategorizedIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const TagIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const ReceiptIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <path d="M8 7h8M8 11h8M8 15h5" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface CategoryVisual {
  icon: React.FC<IconProps>;
  color: string;
  bgLight: string;
  borderLight: string;
  darkColor: string;
  badgeClass: string;
}

/**
 * Maps category name to an appropriate SVG icon and thematic styling
 */
export function getCategoryVisuals(categoryName?: string | null): CategoryVisual {
  const name = (categoryName || "").toLowerCase().trim();

  if (name.includes("food") || name.includes("dining") || name.includes("restaurant") || name.includes("cafe")) {
    return {
      icon: FoodIcon,
      color: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-500/10",
      borderLight: "border-amber-500/20",
      darkColor: "text-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    };
  }

  if (name.includes("transport") || name.includes("travel") || name.includes("cab") || name.includes("fuel") || name.includes("commute")) {
    return {
      icon: TransportIcon,
      color: "text-blue-600 dark:text-blue-400",
      bgLight: "bg-blue-500/10",
      borderLight: "border-blue-500/20",
      darkColor: "text-blue-400",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    };
  }

  if (name.includes("rent") || name.includes("house") || name.includes("flat") || name.includes("maintenance")) {
    return {
      icon: RentIcon,
      color: "text-purple-600 dark:text-purple-400",
      bgLight: "bg-purple-500/10",
      borderLight: "border-purple-500/20",
      darkColor: "text-purple-400",
      badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    };
  }

  if (name.includes("util") || name.includes("bill") || name.includes("electricity") || name.includes("wifi") || name.includes("water")) {
    return {
      icon: UtilitiesIcon,
      color: "text-yellow-600 dark:text-yellow-400",
      bgLight: "bg-yellow-500/10",
      borderLight: "border-yellow-500/20",
      darkColor: "text-yellow-400",
      badgeClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    };
  }

  if (name.includes("entertain") || name.includes("movie") || name.includes("game") || name.includes("subscription")) {
    return {
      icon: EntertainmentIcon,
      color: "text-pink-600 dark:text-pink-400",
      bgLight: "bg-pink-500/10",
      borderLight: "border-pink-500/20",
      darkColor: "text-pink-400",
      badgeClass: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
    };
  }

  if (name.includes("shop") || name.includes("cloth") || name.includes("apparel") || name.includes("electronics")) {
    return {
      icon: ShoppingIcon,
      color: "text-indigo-600 dark:text-indigo-400",
      bgLight: "bg-indigo-500/10",
      borderLight: "border-indigo-500/20",
      darkColor: "text-indigo-400",
      badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    };
  }

  if (name.includes("health") || name.includes("medic") || name.includes("doctor") || name.includes("hospital") || name.includes("fitness")) {
    return {
      icon: HealthcareIcon,
      color: "text-rose-600 dark:text-rose-400",
      bgLight: "bg-rose-500/10",
      borderLight: "border-rose-500/20",
      darkColor: "text-rose-400",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    };
  }

  if (name.includes("educat") || name.includes("book") || name.includes("course") || name.includes("college") || name.includes("school")) {
    return {
      icon: EducationIcon,
      color: "text-teal-600 dark:text-teal-400",
      bgLight: "bg-teal-500/10",
      borderLight: "border-teal-500/20",
      darkColor: "text-teal-400",
      badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    };
  }

  if (name.includes("groc") || name.includes("supermarket") || name.includes("mart")) {
    return {
      icon: GroceriesIcon,
      color: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-500/10",
      borderLight: "border-emerald-500/20",
      darkColor: "text-emerald-400",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    };
  }

  if (name.includes("invest") || name.includes("stock") || name.includes("mutual") || name.includes("crypto") || name.includes("saving")) {
    return {
      icon: InvestmentIcon,
      color: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-500/10",
      borderLight: "border-emerald-500/20",
      darkColor: "text-emerald-400",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    };
  }

  if (name.includes("uncategorized") || name === "") {
    return {
      icon: UncategorizedIcon,
      color: "text-slate-500 dark:text-slate-400",
      bgLight: "bg-slate-500/10",
      borderLight: "border-slate-500/20",
      darkColor: "text-slate-400",
      badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    };
  }

  // Default custom category visual
  return {
    icon: TagIcon,
    color: "text-primary-600 dark:text-primary-400",
    bgLight: "bg-primary-500/10",
    borderLight: "border-primary-500/20",
    darkColor: "text-primary-400",
    badgeClass: "bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20",
  };
}

export const ScanReceiptIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h6" />
    <path d="M9 16h3" />
    <path d="M9 8h6" />
  </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ size = "md", className = "", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${sizeClasses[size]} ${className}`}
    {...props}
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);
