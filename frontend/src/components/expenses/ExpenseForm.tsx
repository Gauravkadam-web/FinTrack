"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Category, PaymentMode } from "@/types";
import { expenseFormSchema, ExpenseFormData } from "@/schemas/expense.schema";
import { getTodayStr } from "@/lib/utils";

interface ExpenseFormProps {
  initialValues?: {
    title: string;
    category_id: string;
    amount: number;
    expense_date: string;
    notes?: string | null;
    payment_mode?: PaymentMode | null;
  };
  categories: Category[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ExpenseForm({
  initialValues,
  categories,
  onSubmit,
  onCancel,
  submitLabel = "Save Expense",
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: initialValues?.title || "",
      category_id: initialValues?.category_id || (categories.length > 0 ? categories[0].id : ""),
      amount: initialValues?.amount || ("" as unknown as number),
      expense_date: initialValues?.expense_date || getTodayStr(),
      notes: initialValues?.notes || "",
      payment_mode: initialValues?.payment_mode || "upi",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <Input
        label="Expense Title *"
        placeholder="e.g. Swiggy food delivery, Grocery, Rent"
        {...register("title")}
        maxLength={50}
        error={errors.title?.message}
      />

      {/* Category and Amount Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category *"
          {...register("category_id")}
          error={errors.category_id?.message}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-surface-100">
              {cat.name}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          step="0.01"
          min="0.01"
          label="Amount (₹) *"
          placeholder="0.00"
          leftIcon={<span className="text-slate-400 font-bold">₹</span>}
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />
      </div>

      {/* Date and Payment Mode Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Expense Date *"
          max={getTodayStr()}
          {...register("expense_date")}
          error={errors.expense_date?.message}
        />

        <Select
          label="Payment Mode"
          {...register("payment_mode")}
          error={errors.payment_mode?.message}
        >
          <option value="upi" className="bg-surface-100">📱 UPI</option>
          <option value="card" className="bg-surface-100">💳 Card (Debit / Credit)</option>
          <option value="cash" className="bg-surface-100">💵 Cash</option>
          <option value="other" className="bg-surface-100">🌐 Other</option>
        </Select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add any additional details or tags..."
          className="w-full bg-surface-100/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          {...register("notes")}
          maxLength={500}
        />
        {errors.notes && <span className="text-xs text-rose-400">{errors.notes.message}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting} className="min-w-[120px]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
