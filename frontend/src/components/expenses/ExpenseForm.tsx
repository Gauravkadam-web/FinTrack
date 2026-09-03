"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  UpiIcon,
  CardIcon,
  CashIcon,
  OtherPaymentIcon,
  TagIcon,
  CloseIcon,
  SparklesIcon,
  ScanReceiptIcon,
} from "@/components/ui/Icons";
import { Category, PaymentMode, AIReceiptScanResponse } from "@/types";
import { expenseFormSchema, ExpenseFormData } from "@/schemas/expense.schema";
import { getTodayStr, triggerHaptic } from "@/lib/utils";
import { createCategory } from "@/lib/api/categories";
import { categorizeExpense } from "@/lib/api/ai";
import { ReceiptScannerModal } from "@/components/ai/ReceiptScannerModal";

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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["swiggy", "zomato", "restaurant", "lunch", "dinner", "breakfast", "cafe", "coffee", "tea", "chai", "burger", "pizza", "biryani", "food", "grocery", "groceries", "supermarket", "snacks"],
  Transport: ["uber", "ola", "auto", "cab", "metro", "bus", "train", "fuel", "petrol", "diesel", "parking", "toll", "flight", "taxi", "transport"],
  Rent: ["rent", "landlord", "flat", "apartment", "house rent", "pg"],
  Utilities: ["electricity", "bill", "water", "gas", "cylinder", "wifi", "broadband", "internet", "recharge", "mobile bill", "utilities"],
  Entertainment: ["netflix", "spotify", "prime", "movie", "cinema", "theatre", "game", "gaming", "concert", "party", "club", "entertainment"],
  Shopping: ["amazon", "flipkart", "myntra", "zara", "clothes", "shoes", "mall", "shopping", "electronics", "gadget"],
  Healthcare: ["doctor", "hospital", "clinic", "medicine", "pharmacy", "medical", "dentist", "health", "gym", "fitness", "test", "lab"],
};

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export function ExpenseForm({
  initialValues,
  categories,
  onSubmit,
  onCancel,
  submitLabel = "Save Expense",
}: ExpenseFormProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const titleValue = watch("title");
  const selectedCategoryId = watch("category_id");
  const currentAmount = watch("amount");

  // Smart Category Suggestion based on Title keywords
  const suggestedCategory = useMemo(() => {
    if (!titleValue || titleValue.trim().length < 2) return null;
    const lowerTitle = titleValue.toLowerCase();

    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((k) => lowerTitle.includes(k))) {
        const match = localCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        if (match && match.id !== selectedCategoryId) {
          return match;
        }
      }
    }
    return null;
  }, [titleValue, localCategories, selectedCategoryId]);

  const handleApplySuggestedCategory = (catId: string) => {
    setValue("category_id", catId, { shouldValidate: true });
    triggerHaptic(15);
  };

  const handleAddAmountIncrement = (inc: number) => {
    const existing = Number(currentAmount) || 0;
    setValue("amount", existing + inc, { shouldValidate: true });
    triggerHaptic(10);
  };

  const handleFormSubmit = async (data: ExpenseFormData) => {
    triggerHaptic(20);
    await onSubmit(data);
  };

  const paymentOptions: { value: PaymentMode; label: string; icon: React.ReactNode }[] = [
    { value: "upi", label: "UPI", icon: <UpiIcon size="xs" /> },
    { value: "card", label: "Card", icon: <CardIcon size="xs" /> },
    { value: "cash", label: "Cash", icon: <CashIcon size="xs" /> },
    { value: "other", label: "Other", icon: <OtherPaymentIcon size="xs" /> },
  ];

  // Quick date setter
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    setValue("expense_date", dateStr, { shouldValidate: true });
    triggerHaptic(10);
  };

  const handleQuickAddCategory = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setIsCatSubmitting(true);
      setCatError("");
      const created = await createCategory(newCatName.trim());
      setLocalCategories((prev) => [...prev, created]);
      setValue("category_id", created.id, { shouldValidate: true });
      setNewCatName("");
      setIsCreatingCategory(false);
      triggerHaptic(15);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [aiSuggestedCat, setAiSuggestedCat] = useState<{ id?: string | null; name: string } | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);

  // Trigger AI auto-categorization on Title Blur if no keyword match exists
  const handleTitleBlur = async () => {
    if (!titleValue || titleValue.trim().length < 3 || suggestedCategory) return;
    try {
      setIsAiCategorizing(true);
      const res = await categorizeExpense({
        title: titleValue.trim(),
        amount: Number(currentAmount) || undefined,
      });
      if (res.suggested_category) {
        setAiSuggestedCat({
          id: res.category_id,
          name: res.suggested_category,
        });
      }
    } catch {
      // Graceful ignore
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleScanComplete = (data: AIReceiptScanResponse) => {
    setValue("title", data.title, { shouldValidate: true });
    setValue("amount", Number(data.amount), { shouldValidate: true });
    setValue("expense_date", data.expense_date, { shouldValidate: true });
    if (data.category_id) {
      setValue("category_id", data.category_id, { shouldValidate: true });
    }
    if (data.payment_mode) {
      setValue("payment_mode", data.payment_mode, { shouldValidate: true });
    }
    if (data.notes) {
      setValue("notes", data.notes, { shouldValidate: true });
    }
    triggerHaptic(20);
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Title & Quick Scan Receipt Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Expense Title *
            </label>
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 transition shadow-xs"
            >
              <ScanReceiptIcon size="xs" />
              <span>Scan Bill 📸</span>
            </button>
          </div>

          <Input
            placeholder="e.g. Swiggy food delivery, Grocery, Metro recharge"
            {...register("title")}
            onBlur={handleTitleBlur}
            maxLength={50}
            error={errors.title?.message}
          />

          {/* Keyword Suggested Category */}
          {suggestedCategory && (
            <div className="flex items-center gap-1.5 pt-0.5 animate-fadeIn">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Suggested category:</span>
              <button
                type="button"
                onClick={() => handleApplySuggestedCategory(suggestedCategory.id)}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 px-2 py-0.5 rounded-md hover:bg-primary-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <TagIcon size="xs" />
                <span>{suggestedCategory.name}</span>
                <span className="text-[9px] opacity-75">(Apply)</span>
              </button>
            </div>
          )}

          {/* AI Suggested Category */}
          {!suggestedCategory && aiSuggestedCat && (
            <div className="flex items-center gap-1.5 pt-0.5 animate-fadeIn">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">AI category match:</span>
              <button
                type="button"
                onClick={() => {
                  if (aiSuggestedCat.id) {
                    handleApplySuggestedCategory(aiSuggestedCat.id);
                  } else {
                    setNewCatName(aiSuggestedCat.name);
                    setIsCreatingCategory(true);
                  }
                  setAiSuggestedCat(null);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <SparklesIcon size="xs" />
                <span>{aiSuggestedCat.name}</span>
                <span className="text-[9px] opacity-75">
                  {aiSuggestedCat.id ? "(Apply)" : "(Create New)"}
                </span>
              </button>
            </div>
          )}

          {isAiCategorizing && (
            <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-primary-500 dark:text-primary-400">
              <span className="w-2.5 h-2.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span>AI analyzing category...</span>
            </div>
          )}
        </div>

      {/* Category and Amount Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Category Selector with Inline Quick-Add */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Category *
            </label>
            {!isCreatingCategory && (
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ New Category</span>
              </button>
            )}
          </div>

          {isCreatingCategory ? (
            <div className="space-y-1.5 p-2 rounded-xl bg-surface-100 border border-primary-300 dark:border-primary-500/30">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface-50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  disabled={isCatSubmitting || !newCatName.trim()}
                  className="px-2.5 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-500 disabled:opacity-50 cursor-pointer"
                >
                  {isCatSubmitting ? "..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setCatError("");
                    setNewCatName("");
                  }}
                  className="p-1.5 text-xs text-slate-400 hover:text-foreground cursor-pointer rounded-lg hover:bg-surface-200 transition-colors"
                  aria-label="Cancel new category"
                >
                  <CloseIcon size="xs" />
                </button>
              </div>
              {catError && <p className="text-[10px] text-rose-500">{catError}</p>}
            </div>
          ) : (
            <Select
              {...register("category_id")}
              error={errors.category_id?.message}
            >
              {localCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Amount Input with Quick Increment Chips */}
        <div className="space-y-1.5">
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
            {QUICK_AMOUNTS.map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleAddAmountIncrement(inc)}
                className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-surface-100 dark:bg-surface-200/60 hover:bg-surface-200 border border-border px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                +{inc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Date with Quick Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Expense Date *
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary/10 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-foreground px-2 py-0.5 rounded-md bg-surface-100 hover:bg-surface-200 transition-colors cursor-pointer"
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
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
              size="sm"
            />
          )}
        />
        {errors.payment_mode && (
          <span className="text-xs text-rose-500">{errors.payment_mode.message}</span>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add additional details, tags, or payment reference..."
          className="w-full bg-white dark:bg-surface-100/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-xs"
          {...register("notes")}
          maxLength={500}
        />
        {errors.notes && <span className="text-xs text-rose-500">{errors.notes.message}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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

    <ReceiptScannerModal
      isOpen={isReceiptModalOpen}
      onClose={() => setIsReceiptModalOpen(false)}
      onScanComplete={handleScanComplete}
    />
  </>
  );
}
