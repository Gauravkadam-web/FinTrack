"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Category } from "@/types";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category>;
  onUpdateCategory: (id: string, name: string) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<void>;
  getExpenseCount: (id: string) => Promise<number>;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  getExpenseCount,
}: CategoryManagerModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingName, setEditingName] = useState("");

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditingName(cat.name);
    setErrorMsg("");
  };

  const handleUpdate = async () => {
    if (!editingCategory || !editingName.trim()) return;
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onUpdateCategory(editingCategory.id, editingName.trim());
      setEditingCategory(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = async (cat: Category) => {
    try {
      setDeletingCategory(cat);
      const count = await getExpenseCount(cat.id);
      setDeleteExpenseCount(count);
    } catch {
      setDeleteExpenseCount(0);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Expense Categories"
        description="Create, rename, or remove categories (FR-6 to FR-9)."
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Create category form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="New category name (e.g. Subscriptions)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                maxLength={50}
                error={errorMsg}
              />
            </div>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting && !editingCategory}
              disabled={!newCategoryName.trim()}
            >
              Add
            </Button>
          </form>

          {/* Categories List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isEditing = editingCategory?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-border hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={50}
                        autoFocus
                        className="py-1.5 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        isLoading={isSubmitting}
                        disabled={!editingName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-primary-600 dark:text-primary font-bold text-xs">
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {cat.name}
                            </span>
                            {cat.is_system && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-200 text-slate-500 dark:text-slate-400 border border-border">
                                System
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {cat.expense_count} {cat.expense_count === 1 ? "expense" : "expenses"}
                          </span>
                        </div>
                      </div>

                      {!cat.is_system && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-foreground hover:bg-surface-100 transition-colors"
                            title="Rename"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => initiateDelete(cat)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete category"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        title={`Delete "${deletingCategory?.name}"?`}
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete this category?
            </p>
            {deleteExpenseCount !== null && deleteExpenseCount > 0 ? (
              <p className="text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30">
                ⚠️ <strong>{deleteExpenseCount}</strong> linked {deleteExpenseCount === 1 ? "expense" : "expenses"} will be automatically reassigned to <strong>Uncategorized</strong>.
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                No expenses are currently linked to this category.
              </p>
            )}
          </div>
        }
        confirmLabel="Delete Category"
        isLoading={isDeleting}
      />
    </>
  );
}
