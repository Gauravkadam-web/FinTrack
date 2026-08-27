"use client";

import React, { useEffect, useState } from "react";
import { useTheme, Theme } from "@/components/ui/ThemeContext";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 bg-surface-100/50 rounded-xl animate-pulse" />
    );
  }

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "system", label: "Auto", icon: "💻" },
  ];

  return (
    <div className="w-full">
      <SegmentedControl
        options={options.map((opt) => ({
          value: opt.value,
          label: opt.label,
          icon: <span className="text-xs">{opt.icon}</span>,
        }))}
        value={theme}
        onChange={(val) => setTheme(val)}
        size="sm"
      />
    </div>
  );
}
