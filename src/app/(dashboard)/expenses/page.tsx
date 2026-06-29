"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Edit2, Trash2, Calendar, Tag, User, Loader2, Download, Phone, CalendarRange, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  category: string | null;
  credit: string;
  debit: string;
  netBalance: string;
  date: Date;
  note: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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

  // Mobile filters toggle state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Custom Category Filter Dropdown states
  const catFilterRef = useRef<HTMLDivElement>(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // Close category filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catFilterRef.current && !catFilterRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Helper to generate and download CSV
  const downloadCSV = (dataToExport: Expense[], filename: string) => {
    const headers = ["Customer", "Mobile", "Category", "Credit (₹)", "Debit (₹)", "Net Balance (₹)", "Date", "Note"];
    const rows = dataToExport.map((expense) => {
      const net = parseFloat(expense.netBalance);
      return [
        expense.customerName,
        expense.customerPhone || "-",
        expense.category || "Uncategorized",
        expense.credit.toString(),
        expense.debit.toString(),
        `${net > 0 ? "Credit " : "Debit "}${Math.abs(net)}`,
        format(expense.date, "yyyy-MM-dd"),
        expense.note || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export 1: Only the filtered data showing on screen
  const handleExportFilteredCSV = () => {
    downloadCSV(
      filteredExpenses,
      `expenses-filtered-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.success("Current filtered view exported successfully.");
  };

  // Export 2: All data in the database
  const handleExportAllCSV = () => {
    downloadCSV(
      expenses,
      `expenses-all-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.success("Complete ledger exported successfully.");
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

  // Calculate totals of filtered expenses for the sticky footer
  const totalCredit = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.credit), 0);
  const totalDebit = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.debit), 0);
  const netBalance = totalCredit - totalDebit;
  const isTotalCreditRemaining = netBalance > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Record and track individual customer expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <Button
            onClick={handleExportFilteredCSV}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2 cursor-pointer"
            disabled={filteredExpenses.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export Current View</span>
          </Button>
          <Button
            onClick={handleExportAllCSV}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2 cursor-pointer"
            disabled={expenses.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export All Customer</span>
          </Button>
          <Button
            onClick={handleAddClick}
            className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-medium gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Unified Premium Search & Collapsible Filters Panel */}
      <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs mb-6">
        {/* Row 1: Search Input + Mobile Filter Toggle Button */}
        <div className="flex gap-3 items-center w-full">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name, mobile, category, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-10 text-sm border border-slate-200 rounded-full bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0b132a] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={cn(
              "rounded-full h-10 px-4 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 sm:hidden cursor-pointer shrink-0 transition-all",
              isFiltersExpanded && "bg-slate-100 text-slate-950 border-slate-300"
            )}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Row 2: 4 Filters with Equal Spacing (Collapsible on Mobile, always visible on Tablet/Desktop) */}
        <div className={cn(
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 transition-all duration-300 mt-4",
          isFiltersExpanded ? "grid animate-in fade-in slide-in-from-top-2" : "hidden sm:grid"
        )}>
          {/* Filter 1: Transaction Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "credit" | "debit")}
              className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
            >
              <option value="all">All Types</option>
              <option value="credit">Credit Only</option>
              <option value="debit">Debit Only</option>
            </select>
          </div>

          {/* Filter 2: Category (Custom Dropdown) */}
          <div className="flex flex-col gap-1.5 relative" ref={catFilterRef}>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category</span>
            <button
              type="button"
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-750 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70 flex items-center justify-between text-left"
            >
              <span>{categoryFilter === "all" ? "All Categories" : categoryFilter}</span>
              <span className="text-slate-400 text-[9px] ml-1">▼</span>
            </button>

            {isCatDropdownOpen && (
              <div className="absolute z-50 w-full top-[58px] bg-white border border-slate-150 rounded-xl shadow-md max-h-[220px] overflow-y-auto p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("all");
                    setIsCatDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                    categoryFilter === "all" ? "bg-[#0b132a] text-white font-semibold" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  All Categories
                </button>
                {dbCategories.map((cat) => {
                  const isSelected = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat);
                        setIsCatDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                        isSelected ? "bg-[#0b132a] text-white font-semibold" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter 3: From Date */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-slate-400" /> From Date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
            />
          </div>

          {/* Filter 4: To Date */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-slate-400" /> To Date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
            />
          </div>
        </div>

        {/* Clear Date Filter Button */}
        {(startDate || endDate) && (
          <div className={cn(
            "justify-end pt-2 border-t border-slate-100",
            isFiltersExpanded ? "flex" : "hidden sm:flex"
          )}>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Expenses Table (Allows horizontal scroll and locks vertical height to prevent endless page scrolling) */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-auto max-h-[530px] sm:max-h-[480px]">
          {loading && expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
              <p className="text-sm">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No expenses found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-150 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-2xs">
                  <th className="px-6 py-4 text-left">Actions</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-red-600 font-bold">Credit</th>
                  <th className="px-6 py-4 text-emerald-700 font-bold">Debit</th>
                  <th className="px-6 py-4 text-slate-800 font-bold">Net Balance</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-left">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredExpenses.map((expense) => {
                  const creditVal = parseFloat(expense.credit);
                  const debitVal = parseFloat(expense.debit);
                  const custNetBal = parseFloat(expense.netBalance);
                  const custCreditRemains = custNetBal > 0;
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/50 transition-colors h-[57px]"
                    >
                      <td className="px-6 py-3.5 text-left">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(expense)}
                            className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(expense.id, expense.customerName)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {expense.customerName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {expense.customerPhone || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {format(expense.date, "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-red-600 bg-red-50/10">
                        {creditVal > 0 ? formatCurrency(expense.credit) : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-emerald-700 bg-emerald-50/10">
                        {debitVal > 0 ? formatCurrency(expense.debit) : "—"}
                      </td>
                      <td className={cn(
                        "px-6 py-3.5 font-bold",
                        custCreditRemains ? "text-red-600 bg-red-50/5" : "text-emerald-700 bg-emerald-50/5"
                      )}>
                        {formatCurrency(Math.abs(custNetBal))}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {expense.category ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            <Tag className="h-3 w-3" />
                            <span>{expense.category}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate text-left">
                        {expense.note || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Sticky Footer showing totals of all filtered customers */}
              <tfoot className="sticky bottom-0 z-10 bg-slate-50 border-t-2 border-slate-200 text-sm font-extrabold text-slate-900 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                <tr className="h-[52px]">
                  <td className="px-6 py-3.5 text-left text-slate-900">Total</td>
                  <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                  <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                  <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                  <td className="px-6 py-3.5 text-red-600 font-extrabold bg-red-50/10">
                    {formatCurrency(totalCredit)}
                  </td>
                  <td className="px-6 py-3.5 text-emerald-700 font-extrabold bg-emerald-50/10">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className={cn(
                    "px-6 py-3.5 font-extrabold",
                    isTotalCreditRemaining ? "text-red-600 bg-red-50/5" : "text-emerald-700 bg-emerald-50/5"
                  )}>
                    {formatCurrency(Math.abs(netBalance))}
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                  <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>

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
