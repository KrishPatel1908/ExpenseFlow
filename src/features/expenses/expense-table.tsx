import { useState } from "react";
import { Edit2, Trash2, Tag, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExpandableNoteProps {
  note: string | null;
}

function ExpandableNote({ note }: ExpandableNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!note) return <span className="text-slate-400 italic">—</span>;
  
  const isLong = note.length > 25;
  
  if (!isLong) {
    return <span className="text-slate-500">{note}</span>;
  }
  
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "text-slate-550 text-xs transition-all duration-250 cursor-pointer hover:text-slate-900 leading-relaxed",
          isExpanded ? "whitespace-normal break-words max-w-[240px]" : "truncate max-w-[140px]"
        )}
        title="Click to toggle full note"
      >
        {note}
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 cursor-pointer p-0"
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}

export interface Expense {
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

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  filteredExpenses: Expense[];
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (id: string, name: string) => void;
  formatCurrency: (value: number | string) => string;
}

export function ExpenseTable({
  expenses,
  loading,
  filteredExpenses,
  onEditClick,
  onDeleteClick,
  formatCurrency,
}: ExpenseTableProps) {
  // Calculate totals of filtered expenses for the sticky footer
  const totalCredit = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.credit), 0);
  const totalDebit = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.debit), 0);
  const netBalance = totalDebit - totalCredit;
  const isTotalDebitRemaining = netBalance > 0;

  return (
    <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs flex-initial flex flex-col min-h-0">
      <div className="overflow-auto flex-1 min-h-0">
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
                <th className="px-6 py-4 text-emerald-700 font-bold">Credit</th>
                <th className="px-6 py-4 text-red-600 font-bold">Debit</th>
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
                const custDebitRemains = custNetBal > 0;
                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50/50 transition-colors h-[57px]"
                  >
                    <td className="px-6 py-3.5 text-left align-top">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClick(expense)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(expense.id, expense.customerName)}
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 align-top">
                      {expense.customerName}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 align-top">
                      {expense.customerPhone || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 align-top">
                      {format(expense.date, "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-700 bg-emerald-50/10 align-top whitespace-nowrap">
                      {creditVal > 0 ? formatCurrency(expense.credit) : "—"}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-red-600 bg-red-50/10 align-top whitespace-nowrap">
                      {debitVal > 0 ? formatCurrency(expense.debit) : "—"}
                    </td>
                    <td className={cn(
                      "px-6 py-3.5 font-bold align-top whitespace-nowrap",
                      custDebitRemains ? "text-red-600 bg-red-50/5" : "text-emerald-700 bg-emerald-50/5"
                    )}>
                      {custDebitRemains 
                        ? formatCurrency(-Math.abs(custNetBal)) 
                        : formatCurrency(Math.abs(custNetBal))}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 align-top">
                      {expense.category ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          <Tag className="h-3 w-3" />
                          <span>{expense.category}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-left align-top max-w-[220px]">
                      <ExpandableNote note={expense.note} />
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
                <td className="px-6 py-3.5 text-emerald-700 font-extrabold bg-emerald-50/10 whitespace-nowrap">
                  {formatCurrency(totalCredit)}
                </td>
                <td className="px-6 py-3.5 text-red-600 font-extrabold bg-red-50/10 whitespace-nowrap">
                  {formatCurrency(totalDebit)}
                </td>
                <td className={cn(
                  "px-6 py-3.5 font-extrabold whitespace-nowrap",
                  isTotalDebitRemaining ? "text-red-600 bg-red-50/5" : "text-emerald-700 bg-emerald-50/5"
                )}>
                  {isTotalDebitRemaining 
                    ? formatCurrency(-Math.abs(netBalance)) 
                    : formatCurrency(Math.abs(netBalance))}
                </td>
                <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
                <td className="px-6 py-3.5 text-slate-400 font-normal">—</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </Card>
  );
}
