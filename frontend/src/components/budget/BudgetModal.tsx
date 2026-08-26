"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Category } from "@/types";
import { budgetFormSchema, BudgetFormData } from "@/schemas/budget.schema";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    category_id?: string | null;
    period_month: string;
    limit_amount: number;
  }) => Promise<void>;
  categories: Category[];
  initialMonth: string;
  initialCategoryId?: string | null;
  initialLimitAmount?: number;
  budgetId?: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialMonth,
  initialCategoryId = null,
  initialLimitAmount,
  budgetId,
}: BudgetModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category_id: initialCategoryId || "",
      period_month: initialMonth,
      limit_amount: initialLimitAmount || ("" as unknown as number),
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        category_id: initialCategoryId || "",
        period_month: initialMonth,
        limit_amount: initialLimitAmount || ("" as unknown as number),
      });
    }
  }, [isOpen, initialMonth, initialCategoryId, initialLimitAmount, reset]);

  const onFormSubmit = async (data: BudgetFormData) => {
    await onSubmit({
      id: budgetId,
      category_id: data.category_id ? data.category_id : null,
      period_month: data.period_month,
      limit_amount: data.limit_amount,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetId ? "Update Budget Limit" : "Set Monthly Budget"}
      description="Set spending limits to keep your expenses on track."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Month Selector */}
        <Input
          type="month"
          label="Budget Month"
          {...register("period_month")}
          error={errors.period_month?.message}
          disabled={Boolean(budgetId)} // Don't allow changing month on existing budget
        />

        {/* Category Selector (Overall vs Category) */}
        {!budgetId && (
          <Select
            label="Budget Scope"
            {...register("category_id")}
            error={errors.category_id?.message}
          >
            <option value="" className="bg-surface-100">
              📊 Overall Monthly Budget (All Expenses)
            </option>
            <optgroup label="Or Specific Category" className="bg-surface-100">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </Select>
        )}

        {/* Limit Amount */}
        <Input
          type="number"
          step="0.01"
          min="0.01"
          label="Limit Amount (₹)"
          placeholder="e.g. 25000"
          leftIcon={<span className="text-slate-400 font-bold">₹</span>}
          {...register("limit_amount", { valueAsNumber: true })}
          error={errors.limit_amount?.message}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {budgetId ? "Update Limit" : "Save Budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
