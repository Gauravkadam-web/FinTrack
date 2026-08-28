"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ExpenseFormData } from "@/schemas/expense.schema";

interface AppLayoutProps {
  children: React.ReactNode;
  onExpenseAdded?: () => void;
  onCategoryChanged?: () => void;
}

export function AppLayout({
  children,
  onExpenseAdded,
  onCategoryChanged,
}: AppLayoutProps) {
  useKeyboardShortcuts();

  const {
    categories,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
    refreshCategories,
  } = useCategories();

  const { addExpense } = useExpenses();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleQuickAddExpense = async (data: ExpenseFormData) => {
    await addExpense(data);
    setIsQuickAddOpen(false);
    refreshCategories();
    if (onExpenseAdded) {
      onExpenseAdded();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await removeCategory(id);
    if (onCategoryChanged) {
      onCategoryChanged();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Vertical Sidebar & Mobile Header */}
      <Sidebar
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Main Content Area (Offset by 256px on lg screens) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {children}
        </main>
      </div>

      {/* Global Quick Add Expense Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Record New Expense"
        description="Quickly record your transaction details."
        maxWidth="md"
      >
        <ExpenseForm
          categories={categories}
          onSubmit={handleQuickAddExpense}
          onCancel={() => setIsQuickAddOpen(false)}
          submitLabel="Save Expense"
        />
      </Modal>

      {/* Global Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategoryName}
        onDeleteCategory={handleDeleteCategory}
        getExpenseCount={getExpenseCount}
      />
    </div>
  );
}
