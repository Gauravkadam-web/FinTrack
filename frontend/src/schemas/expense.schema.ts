import { z } from "zod";
import { getTodayStr } from "@/lib/utils";

export const expenseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(50, "Title cannot exceed 50 characters"),
  category_id: z
    .string()
    .min(1, "Please select a category"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can have at most 2 decimal places",
    }),
  expense_date: z
    .string()
    .min(1, "Expense date is required")
    .refine((val) => val <= getTodayStr(), {
      message: "Expense date cannot be in the future",
    }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  payment_mode: z
    .enum(["cash", "card", "upi", "other"])
    .optional()
    .nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
