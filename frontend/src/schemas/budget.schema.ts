import { z } from "zod";

export const budgetFormSchema = z.object({
  category_id: z
    .string()
    .optional()
    .nullable(),
  period_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in 'YYYY-MM' format"),
  limit_amount: z
    .number({ invalid_type_error: "Budget limit must be a number" })
    .positive("Budget limit must be greater than 0")
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Limit can have at most 2 decimal places",
    }),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;
