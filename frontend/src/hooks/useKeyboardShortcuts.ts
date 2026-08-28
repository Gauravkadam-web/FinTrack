"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in form inputs, textareas, or contentEditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Modifier key combos can be ignored or handled separately
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
        case "+":
          e.preventDefault();
          router.push("/expenses/new");
          break;
        case "1":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "2":
          e.preventDefault();
          router.push("/expenses");
          break;
        case "3":
          e.preventDefault();
          router.push("/budgets");
          break;
        case "4":
          e.preventDefault();
          router.push("/categories");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
