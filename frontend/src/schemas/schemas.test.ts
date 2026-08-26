import { describe, it, expect } from "vitest";
import { expenseFormSchema } from "./expense.schema";
import { categoryFormSchema } from "./category.schema";
import { budgetFormSchema } from "./budget.schema";

describe("Frontend Zod Schemas Validation", () => {
  describe("Expense Form Schema", () => {
    it("validates a valid expense", () => {
      const validData = {
        title: "Grocery Shopping",
        category_id: "c71bb5fe-f30f-47e0-aa4e-a26e48a2fa59",
        amount: 450.5,
        expense_date: "2026-08-20",
        notes: "Bought vegetables",
        payment_mode: "upi",
      };
      const result = expenseFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects empty title or title > 50 chars", () => {
      const invalid = {
        title: "   ",
        category_id: "123",
        amount: 100,
        expense_date: "2026-08-20",
      };
      const result = expenseFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects non-positive amount", () => {
      const invalid = {
        title: "Snacks",
        category_id: "123",
        amount: -10,
        expense_date: "2026-08-20",
      };
      const result = expenseFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Category Form Schema", () => {
    it("accepts valid category name", () => {
      const result = categoryFormSchema.safeParse({ name: "Entertainment" });
      expect(result.success).toBe(true);
    });

    it("rejects empty category name", () => {
      const result = categoryFormSchema.safeParse({ name: "   " });
      expect(result.success).toBe(false);
    });
  });

  describe("Budget Form Schema", () => {
    it("accepts valid budget", () => {
      const result = budgetFormSchema.safeParse({
        period_month: "2026-08",
        limit_amount: 15000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid month format", () => {
      const result = budgetFormSchema.safeParse({
        period_month: "August 2026",
        limit_amount: 15000,
      });
      expect(result.success).toBe(false);
    });
  });
});
