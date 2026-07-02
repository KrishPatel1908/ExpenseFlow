import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Tag, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface RecentExpenseItem {
  id: string;
  customerName: string;
  category: string | null;
  credit: string;
  debit: string;
  date: Date | string;
}

interface RecentExpensesProps {
  expenses: RecentExpenseItem[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(parseFloat(value));
  };

  return (
    <Link href="/expenses" className="block group select-none">
      <Card className="border border-slate-200 bg-white shadow-xs transition-all duration-200 group-hover:border-slate-350 group-hover:shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
              <span>Recent Transactions</span>
              <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">The 5 most recently recorded transactions.</CardDescription>
          </div>
          <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
            View All
          </span>
        </CardHeader>
        <CardContent className="pt-2">
          {expenses.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 text-emerald-700">Credit</th>
                    <th className="px-4 py-3 text-red-600">Debit</th>
                    <th className="px-4 py-3 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{expense.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                         {expense.category ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                            <Tag className="h-3 w-3" />
                            {expense.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">
                        {parseFloat(expense.credit) > 0 ? formatCurrency(expense.credit) : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-red-600 whitespace-nowrap">
                        {parseFloat(expense.debit) > 0 ? formatCurrency(expense.debit) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{format(new Date(expense.date), "dd MMM yyyy")}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
