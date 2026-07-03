"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayoutLock } from "@/components/page-layout-lock";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { ExpenseFilters } from "@/features/expenses/expense-filters";
import { ExpenseTable, type Expense } from "@/features/expenses/expense-table";
import { ExpenseExportDropdown } from "@/features/expenses/expense-export-dropdown";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useExpensesPage } from "@/features/expenses/use-expenses-page";
import { deleteExpense } from "@/services/expense-actions";
import { toast } from "sonner";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(typeof value === "string" ? parseFloat(value) : value);

export default function ExpensesPage() {
  const {
    expenses, dbCategories, loading,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    filteredExpenses, isFilterApplied,
    loadData,
  } = useExpensesPage();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; customerName: string } | null>(null);

  const handleAddClick = () => { setEditingExpense(null); setIsFormOpen(true); };
  const handleEditClick = (expense: Expense) => { setEditingExpense(expense); setIsFormOpen(true); };
  const handleDeleteClick = (id: string, customerName: string) => {
    setExpenseToDelete({ id, customerName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const result = await deleteExpense(expenseToDelete.id);
      if (result.error) toast.error(result.error);
      else { toast.success("Transaction deleted successfully."); loadData(); }
    } catch {
      toast.error("Failed to delete transaction.");
    } finally {
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6 pb-2 sm:pb-0">
      <PageLayoutLock />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Record and track individual customer expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <ExpenseExportDropdown
            expenses={expenses}
            filteredExpenses={filteredExpenses}
            startDate={startDate}
            endDate={endDate}
            typeFilter={typeFilter}
            categoryFilter={categoryFilter}
            searchQuery={searchQuery}
            isFilterApplied={isFilterApplied}
          />
          <Button
            onClick={handleAddClick}
            className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-medium gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      <ExpenseFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        dbCategories={dbCategories}
      />

      {(startDate || endDate) && (
        <div className="flex sm:hidden justify-end -mt-3">
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition-colors flex items-center gap-1"
          >
            <span>✕</span><span>Clear Date Filter</span>
          </button>
        </div>
      )}

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        filteredExpenses={filteredExpenses}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        formatCurrency={formatCurrency}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete the transaction of "${expenseToDelete?.customerName}"? This action cannot be undone.`}
        confirmText="Delete"
        isSubmitting={false}
      />

      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingExpense}
        onSuccess={loadData}
      />
    </div>
  );
}
