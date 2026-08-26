import { describe, it, expect } from "vitest";
import { formatINR, formatDate, formatMonthYear, getCurrentMonthStr, getPaymentModeBadge } from "./utils";

describe("Frontend Utility Functions", () => {
  it("formats currency to INR correctly", () => {
    expect(formatINR(0)).toBe("₹0.00");
    expect(formatINR(1250.5)).toBe("₹1,250.50");
    expect(formatINR("50000")).toBe("₹50,000.00");
    expect(formatINR(null)).toBe("₹0.00");
    expect(formatINR(undefined)).toBe("₹0.00");
  });

  it("formats date strings properly", () => {
    expect(formatDate("2026-08-27")).toContain("2026");
    expect(formatDate("")).toBe("");
  });

  it("formats month-year strings properly", () => {
    expect(formatMonthYear("2026-08")).toContain("August");
    expect(formatMonthYear("2026-08")).toContain("2026");
  });

  it("returns current month format YYYY-MM", () => {
    const current = getCurrentMonthStr();
    expect(current).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns appropriate badge colors for payment modes", () => {
    expect(getPaymentModeBadge("upi").label).toBe("UPI");
    expect(getPaymentModeBadge("card").label).toBe("Card");
    expect(getPaymentModeBadge("cash").label).toBe("Cash");
    expect(getPaymentModeBadge("other").label).toBe("Other");
  });
});
