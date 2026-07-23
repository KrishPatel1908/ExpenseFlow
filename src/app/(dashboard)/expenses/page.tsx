"use client";

import { useState } from "react";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayoutLock } from "@/components/page-layout-lock";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { ExpenseFilters } from "@/features/expenses/expense-filters";
import { ExpenseTable, type Expense } from "@/features/expenses/expense-table";
import { ExpensePagination } from "@/features/expenses/expense-pagination";
import { ExpenseExportDropdown } from "@/features/expenses/expense-export-dropdown";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useExpensesPage } from "@/features/expenses/use-expenses-page";
import { deleteExpense } from "@/services/expense-actions";
import { VoiceButton } from "@/features/voice/components/VoiceButton";
import type { VoiceConfirmationFormValues } from "@/features/voice/components/VoiceTransactionDialog";
import { toast } from "sonner";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof value === "string" ? parseFloat(value) : value);

export default function ExpensesPage() {
  const {
    expenses,
    dbCategories,
    loading,
    hasError,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isFilterApplied,
    loadData,
  } = useExpensesPage();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [prefilledVoiceExpense, setPrefilledVoiceExpense] = useState<{
    customerName: string;
    credit: string;
    debit: string;
    category?: string;
    note?: string;
    date: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; customerName: string } | null>(null);

  const handleAddClick = () => {
    setEditingExpense(null);
    setPrefilledVoiceExpense(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setPrefilledVoiceExpense(null);
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string, customerName: string) => {
    setExpenseToDelete({ id, customerName });
    setDeleteDialogOpen(true);
  };

  // Called when Voice Module confirms extracted transaction data
  const handleVoiceComplete = (voiceData: VoiceConfirmationFormValues) => {
    setEditingExpense(null);
    setPrefilledVoiceExpense({
      customerName: voiceData.customer,
      credit: voiceData.transactionType === "credit" ? String(voiceData.amount) : "0",
      debit: voiceData.transactionType === "debit" ? String(voiceData.amount) : "0",
      category: voiceData.category || "",
      note: voiceData.description || "",
      date: voiceData.date,
    });
    setIsFormOpen(true);
    toast.info("Form populated with voice transaction details. Review and click Save.");
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const result = await deleteExpense(expenseToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Transaction deleted successfully.");
        loadData();
      }
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
          {/* Reusable Voice Button with Language Selector */}
          <VoiceButton onVoiceComplete={handleVoiceComplete} />

          <ExpenseExportDropdown
            expenses={expenses}
            filteredExpenses={expenses}
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

      {/* Filters Bar */}
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

      {/* Error State with Retry Button */}
      {hasError ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-rose-100 p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <h3 className="text-base font-bold text-slate-900">Failed to Load Expenses</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Could not fetch transactions from the database. Please check your network connection and retry.
          </p>
          <Button
            onClick={loadData}
            variant="outline"
            className="gap-2 text-xs font-semibold cursor-pointer border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Loading</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Main Table */}
          <ExpenseTable
            expenses={expenses}
            loading={loading}
            filteredExpenses={expenses}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            formatCurrency={formatCurrency}
          />

          {/* Server-Side Pagination */}
          <ExpensePagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </>
      )}

      {/* Confirmation Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete the transaction of "${expenseToDelete?.customerName}"? This action cannot be undone.`}
        confirmText="Delete"
        isSubmitting={false}
      />

      {/* Reusable Expense Form */}
      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setPrefilledVoiceExpense(null);
          }
        }}
        initialData={editingExpense || prefilledVoiceExpense}
        onSuccess={loadData}
      />
    </div>
  );
}
