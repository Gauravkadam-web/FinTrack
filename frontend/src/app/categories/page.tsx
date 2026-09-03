"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories } from "@/hooks/useCategories";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { TiltCard } from "@/components/ui/TiltCard";
import { SpatialTransition } from "@/components/ui/SpatialTransition";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CloseIcon, WarningIcon } from "@/components/ui/Icons";
import { Category } from "@/types";

export default function CategoriesPage() {
  const {
    categories,
    isLoading,
    addCategory,
    updateCategoryName,
    removeCategory,
    getExpenseCount,
    refreshCategories,
  } = useCategories();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [categories, searchQuery]);

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setIsCreating(true);
      setCreateError("");
      await addCategory(newCatName.trim());
      setNewCatName("");
      setIsCreateModalOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Edit Start
  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditError("");
  };

  // Handle Edit Submit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    try {
      setIsEditing(true);
      setEditError("");
      await updateCategoryName(editingCategory.id, editName.trim());
      setEditingCategory(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Delete Start
  const handleStartDelete = async (cat: Category) => {
    try {
      setDeletingCategory(cat);
      const count = await getExpenseCount(cat.id);
      setDeleteExpenseCount(count);
    } catch {
      setDeleteExpenseCount(0);
    }
  };

  // Handle Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await removeCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err) {
      console.error("Delete category failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpenseCount = useMemo(() => {
    return categories.reduce((acc, c) => acc + (c.expense_count || 0), 0);
  }, [categories]);

  return (
    <AppLayout onCategoryChanged={refreshCategories} onExpenseAdded={refreshCategories}>
      <SpatialTransition className="space-y-6">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Categories Hub
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                {categories.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize, customize, and manage your expense classification taxonomy.
            </p>
          </div>

          {/* Create Category Button */}
          <button
            onClick={() => {
              setCreateError("");
              setNewCatName("");
              setIsCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-primary-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Category</span>
          </button>
        </div>

        {/* 2. 3D Stat Deck */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TiltCard maxTilt={10} className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
              Total Categories
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1" style={{ transform: "translateZ(32px)" }}>
              {categories.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Active categories in DB</p>
          </TiltCard>

          <TiltCard maxTilt={10} className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
              Custom Categories
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1" style={{ transform: "translateZ(32px)" }}>
              {categories.filter((c) => !c.is_system).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">User-created custom tags</p>
          </TiltCard>

          <TiltCard maxTilt={10} className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
              System Protected
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1" style={{ transform: "translateZ(32px)" }}>
              {categories.filter((c) => c.is_system).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Default system baseline</p>
          </TiltCard>

          <TiltCard maxTilt={10} className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ transform: "translateZ(28px)" }}>
              Tracked Expenses
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1" style={{ transform: "translateZ(32px)" }}>
              {totalExpenseCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Categorized records</p>
          </TiltCard>
        </div>

        {/* 3. Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-surface-200/80 hover:bg-surface-300 text-slate-500 hover:text-foreground flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="Clear search"
                    aria-label="Clear category search"
                  >
                    <CloseIcon size="xs" />
                  </button>
                ) : null
              }
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
        </div>

        {/* 4. Category Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-surface-100 animate-pulse border border-border" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-50 border border-dashed border-border text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No categories matching &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleStartEdit}
                onDelete={handleStartDelete}
              />
            ))}
          </div>
        )}
      </SpatialTransition>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Category"
        description="Add a custom category to organize and tag your expenses."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Freelance Tools, Gym & Fitness, Pet Care"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            maxLength={50}
            autoFocus
            error={createError}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating} disabled={!newCatName.trim()}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title={`Rename "${editingCategory?.name}"`}
        description="Update the display name of this category."
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Category Name *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={50}
            autoFocus
            error={editError}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingCategory(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isEditing} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Category Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deletingCategory?.name}"?`}
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete this category?
            </p>
            {deleteExpenseCount !== null && deleteExpenseCount > 0 ? (
              <p className="text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 flex items-start gap-1.5">
                <WarningIcon size="sm" className="shrink-0 mt-0.5" />
                <span>
                  <strong>{deleteExpenseCount}</strong> linked {deleteExpenseCount === 1 ? "expense" : "expenses"} will be automatically reassigned to <strong>Uncategorized</strong>.
                </span>
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
    </AppLayout>
  );
}
