"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Calendar, Tag, User, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getExpenses, deleteExpense } from "@/services/expense-actions";
import { getCustomers } from "@/services/customer-actions";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { format } from "date-fns";
import { toast } from "sonner";

interface Expense {
  id: string;
  amount: string;
  category: string | null;
  description: string | null;
  expenseDate: Date;
  customerId: string;
  customerName: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const customersData = await getCustomers();
      setCustomers(customersData);

      const expensesData = await getExpenses(selectedCustomerId || undefined);
      // Map to correct Date object structure
      const formattedExpenses = expensesData.map(e => ({
        ...e,
        expenseDate: new Date(e.expenseDate)
      }));
      setExpenses(formattedExpenses);
    } catch (error) {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, amount: string, customerName: string) => {
    if (confirm(`Are you sure you want to delete the expense of ${formatCurrency(amount)} for "${customerName}"?`)) {
      try {
        const result = await deleteExpense(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Expense deleted successfully.");
          loadData();
        }
      } catch (error) {
        toast.error("Failed to delete expense.");
      }
    }
  };

  const handleEditClick = (expense: any) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(parseFloat(value));
  };

  const handleExportCSV = () => {
    const headers = ["Customer", "Amount (₹)", "Category", "Description", "Date"];
    const rows = expenses.map((expense) => [
      expense.customerName,
      expense.amount.toString(),
      expense.category || "Uncategorized",
      expense.description || "",
      format(expense.expenseDate, "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported successfully.");
  };

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
            onClick={handleExportCSV}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2"
            disabled={expenses.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button 
            onClick={handleAddClick}
            className="bg-slate-950 hover:bg-slate-900 text-white font-medium gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Expenses Table */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading && expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
              <p className="text-sm">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No expenses found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {expenses.map((expense) => (
                  <tr 
                    key={expense.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{expense.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {expense.category ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          <Tag className="h-3 w-3" />
                          <span>{expense.category}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {expense.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{format(expense.expenseDate, "dd MMM yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(expense)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id, expense.amount, expense.customerName)}
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        customers={customers}
        initialData={editingExpense}
        onSuccess={loadData}
      />
    </div>
  );
}
