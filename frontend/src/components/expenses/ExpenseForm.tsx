"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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
    setValue,
    control,
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

  const paymentOptions: { value: PaymentMode; label: string; icon: string }[] = [
    { value: "upi", label: "UPI", icon: "⚡" },
    { value: "card", label: "Card", icon: "💳" },
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "other", label: "Other", icon: "🌐" },
  ];

  // Quick date setter
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    setValue("expense_date", dateStr, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <Input
        label="Expense Title *"
        placeholder="e.g. Swiggy food delivery, Grocery, Metro recharge"
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

      {/* Expense Date with Quick Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Expense Date *
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="text-[11px] font-semibold text-primary-400 hover:text-primary-300 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-md bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              Yesterday
            </button>
          </div>
        </div>
        <Input
          type="date"
          max={getTodayStr()}
          {...register("expense_date")}
          error={errors.expense_date?.message}
        />
      </div>

      {/* Payment Mode Selector (Segmented 1-Tap Toggle) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Payment Mode
        </label>
        <Controller
          control={control}
          name="payment_mode"
          render={({ field }) => (
            <SegmentedControl
              options={paymentOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
                icon: <span>{opt.icon}</span>,
              }))}
              value={field.value || "upi"}
              onChange={(val) => field.onChange(val)}
              size="md"
            />
          )}
        />
        {errors.payment_mode && (
          <span className="text-xs text-rose-400">{errors.payment_mode.message}</span>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add additional details, tags, or payment reference..."
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
        <Button type="submit" isLoading={isSubmitting} className="min-w-[130px]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
