"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  Tag, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2, 
  Receipt,
  FileText,
  Wallet,
  IndianRupee,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  getCustomerDashboardStats, 
  getCustomerMonthlyTrend, 
  getCustomerExpensesList 
} from "@/services/customer-dashboard-actions";
import { deleteExpense } from "@/services/expense-actions";
import { AnalyticsCharts } from "@/features/dashboard/analytics-charts";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExpenseItem {
  id: string;
  amount: string;
  category: string | null;
  description: string | null;
  expenseDate: Date | string;
}

interface CustomerDetails {
  id: string;
  name: string;
  phone: string;
  monthlyBudget: number;
  yearlyBudget: number;
  notes?: string | null;
}

interface StatsData {
  totalMonthlyBudget: number;
  totalMonthlyExpense: number;
  remainingBudget: number;
  totalYearlyBudget: number;
  totalYearlyExpense: number;
}

export default function CustomerDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [trendData, setTrendData] = useState<{ month: string; amount: number }[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await getCustomerDashboardStats(customerId);
      setCustomer(statsData.customer);
      setStats(statsData.stats);

      const trend = await getCustomerMonthlyTrend(customerId);
      setTrendData(trend);

      const expenseList = await getCustomerExpensesList(customerId);
      setExpenses(expenseList);
    } catch (error) {
      toast.error("Failed to load customer dashboard data.");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId, loadCustomerData]);

  const handleDeleteExpense = async (id: string, amount: string) => {
    if (confirm(`Are you sure you want to delete this expense of ${formatCurrency(amount)}?`)) {
      try {
        const result = await deleteExpense(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Expense deleted successfully.");
          loadCustomerData();
        }
      } catch (error) {
        toast.error("Failed to delete expense.");
      }
    }
  };

  const handleEditExpenseClick = (expense: any) => {
    // Map customerId for form expectation
    setEditingExpense({
      ...expense,
      customerId,
    });
    setIsFormOpen(true);
  };

  const handleAddExpenseClick = () => {
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

  const handleExportCSV = () => {
    if (!customer) return;
    const headers = ["Amount (₹)", "Category", "Description", "Date"];
    const rows = expenses.map((expense) => [
      expense.amount.toString(),
      expense.category || "Uncategorized",
      expense.description || "",
      format(new Date(expense.expenseDate), "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${customer.name.toLowerCase().replace(/\s+/g, "-")}-expenses.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expense history exported successfully.");
  };

  if (loading && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        <p className="text-sm">Loading customer dashboard...</p>
      </div>
    );
  }

  if (!customer || !stats) {
    return null;
  }

  const remainingIsNegative = stats.remainingBudget < 0;

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link 
            href="/customers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Customers</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
            {customer.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {customer.phone}
            </span>
          </div>
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
            onClick={handleAddExpenseClick}
            className="bg-slate-950 hover:bg-slate-900 text-white font-medium gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* Customer Notes */}
      {customer.notes && (
        <Card className="border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes</h4>
              <p className="text-sm text-slate-600 mt-1">{customer.notes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Customer Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Budget */}
        <Card className="flex items-center justify-between p-6 border border-slate-200 bg-white shadow-xs">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Monthly Budget</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(stats.totalMonthlyBudget)}
            </h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 bg-slate-100">
            <IndianRupee className="h-5 w-5" />
          </div>
        </Card>

        {/* Monthly Spent */}
        <Card className="flex items-center justify-between p-6 border border-slate-200 bg-white shadow-xs">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Monthly Spent</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(stats.totalMonthlyExpense)}
            </h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-600 bg-rose-50">
            <Receipt className="h-5 w-5" />
          </div>
        </Card>

        {/* Remaining Budget */}
        <Card className="flex items-center justify-between p-6 border border-slate-200 bg-white shadow-xs">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Remaining Budget</p>
            <h3 className={cn("text-2xl font-bold tracking-tight", remainingIsNegative ? "text-rose-600" : "text-emerald-600")}>
              {formatCurrency(stats.remainingBudget)}
            </h3>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", remainingIsNegative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
            <Wallet className="h-5 w-5" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Yearly Budget Card */}
        <Card className="p-6 border border-slate-200 bg-white shadow-xs flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Yearly Budget Limit</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {formatCurrency(stats.totalYearlyBudget)}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Yearly</span>
        </Card>

        {/* Yearly Spent Card */}
        <Card className="p-6 border border-slate-200 bg-white shadow-xs flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Spent (Current Year)</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {formatCurrency(stats.totalYearlyExpense)}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">Expenses</span>
        </Card>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts 
        totalMonthlyBudget={stats.totalMonthlyBudget}
        totalMonthlyExpense={stats.totalMonthlyExpense}
        trendData={trendData}
      />

      {/* Expense History Table */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-950">Expense History</h3>
          <p className="text-sm text-slate-500">Full audit log of expenses recorded for this customer.</p>
        </div>
        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No expenses recorded for this customer yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {expense.category ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
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
                        <span>{format(new Date(expense.expenseDate), "dd MMM yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExpenseClick(expense)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id, expense.amount)}
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

      {/* Record Expense Modal Form */}
      <ExpenseForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        customers={customer ? [{ id: customer.id, name: customer.name }] : []}
        initialData={editingExpense}
        onSuccess={loadCustomerData}
      />
    </div>
  );
}
