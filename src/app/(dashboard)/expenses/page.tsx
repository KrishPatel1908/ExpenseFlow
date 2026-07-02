"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Download, ChevronDown, FileText, FileSpreadsheet, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { getExpenses, deleteExpense, getCategories } from "@/services/expense-actions";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { ExpenseFilters } from "@/features/expenses/expense-filters";
import { ExpenseTable, type Expense } from "@/features/expenses/expense-table";
import { exportExpensesPDF, shareExpensesPDFWhatsApp } from "@/lib/pdf-export";
import { exportExpensesExcel } from "@/lib/excel-export";
import { toast } from "sonner";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Export Dropdown State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Custom Delete Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; customerName: string } | null>(null);

  // Search states (Instant for input, debounced for filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Other filters state
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Helper to get today's date in YYYY-MM-DD local format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());

  // Automatically set endDate to today's date if startDate is selected but endDate is empty
  useEffect(() => {
    if (startDate && !endDate) {
      setEndDate(getTodayDateString());
    }
  }, [startDate, endDate]);

  // Debounce effect for search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(),
        getCategories()
      ]);

      // Map to correct Date object structure
      const formattedExpenses = expensesData.map(e => ({
        ...e,
        date: new Date(e.date)
      }));
      setExpenses(formattedExpenses);
      setDbCategories(categoriesData);
    } catch {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDeleteClick = (id: string, customerName: string) => {
    setExpenseToDelete({ id, customerName });
    setDeleteDialogOpen(true);
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

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      expense.customerName.toLowerCase().includes(searchLower) ||
      (expense.customerPhone && expense.customerPhone.includes(searchLower)) ||
      (expense.category && expense.category.toLowerCase().includes(searchLower)) ||
      (expense.note && expense.note.toLowerCase().includes(searchLower));

    // Type Filter
    let matchesType = true;
    if (typeFilter === "credit") {
      matchesType = parseFloat(expense.credit) > 0;
    } else if (typeFilter === "debit") {
      matchesType = parseFloat(expense.debit) > 0;
    }

    // Category Filter
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

    // Date Range Filter (From Date to To Date)
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && expense.date >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && expense.date <= end;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  // Export handlers
  const getFilterDesc = () => {
    const typeText = `Type: ${typeFilter === "all" ? "ALL" : typeFilter.toUpperCase()}`;
    const categoryText = `Category: ${categoryFilter === "all" ? "ALL" : categoryFilter}`;
    const searchText = searchQuery ? `Search: "${searchQuery}"` : "";

    return [
      typeText,
      categoryText,
      searchText
    ].filter(Boolean).join("    |    ");
  };

  const handleExportFilteredPDF = () => {
    exportExpensesPDF(
      filteredExpenses,
      startDate,
      endDate,
      getFilterDesc(),
      `expenses-filtered-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportAllPDF = () => {
    exportExpensesPDF(
      expenses,
      startDate,
      endDate,
      "Type: ALL    |    Category: ALL",
      `expenses-all-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportFilteredExcel = () => {
    const dateStr = startDate && endDate 
      ? `${startDate}-to-${endDate}` 
      : `all-dates-${new Date().toISOString().split("T")[0]}`;
    exportExpensesExcel(
      filteredExpenses,
      `expenses-${dateStr}.csv`,
      startDate,
      endDate,
      typeFilter,
      categoryFilter,
      searchQuery
    );
  };

  const handleExportAllExcel = () => {
    exportExpensesExcel(
      expenses,
      `expenses-all-dates-${new Date().toISOString().split("T")[0]}.csv`,
      startDate,
      endDate,
      "all",
      "all",
      ""
    );
  };

  const handleShareWhatsApp = () => {
    shareExpensesPDFWhatsApp(
      filteredExpenses,
      startDate,
      endDate,
      getFilterDesc()
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6 pb-2 sm:pb-0">
      {/* Dynamic Style Injection to lock layouts only for this page */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          height: 100% !important;
          overflow: hidden !important;
        }
        main {
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        main > div {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          width: 100% !important;
        }
      `}} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Record and track individual customer expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", exportDropdownOpen && "rotate-180")} />
            </Button>

            {exportDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* 1. Mobile WhatsApp Option (TOP OF THE LIST ON MOBILE ONLY) */}
                <div className="block sm:hidden border-b border-slate-100 pb-1.5 mb-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Share
                  </div>
                  <button
                    onClick={() => {
                      handleShareWhatsApp();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredExpenses.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Share via WhatsApp</span>
                  </button>
                </div>

                {/* 2. PDF Section */}
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    PDF Reports
                  </div>
                  <button
                    onClick={() => {
                      handleExportFilteredPDF();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredExpenses.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export Filtered (PDF)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportAllPDF();
                      setExportDropdownOpen(false);
                    }}
                    disabled={expenses.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export All (PDF)</span>
                  </button>
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* 3. Excel Section */}
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Excel Spreadsheets
                  </div>
                  <button
                    onClick={() => {
                      handleExportFilteredExcel();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredExpenses.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export Filtered (Excel)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportAllExcel();
                      setExportDropdownOpen(false);
                    }}
                    disabled={expenses.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export All (Excel)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleAddClick}
            className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-medium gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Modular Expense Filters Panel */}
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

      {/* Clear Date Filter — Mobile only, between filter card and table */}
      {(startDate || endDate) && (
        <div className="flex sm:hidden justify-end -mt-3">
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition-colors flex items-center gap-1"
          >
            <span>✕</span>
            <span>Clear Date Filter</span>
          </button>
        </div>
      )}

      {/* Modular Expense Table Component */}
      <ExpenseTable
        expenses={expenses}
        loading={loading}
        filteredExpenses={filteredExpenses}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        formatCurrency={formatCurrency}
      />

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-slate-900">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Are you sure you want to delete the transaction of <span className="font-bold text-slate-950">&quot;{expenseToDelete?.customerName}&quot;</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setExpenseToDelete(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingExpense}
        onSuccess={loadData}
      />
    </div>
  );
}
