"use client";

import { Edit2, Trash2, Loader2, Calendar, Receipt, IndianRupee, Tag, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CustomerWithStats } from "@/services/customer-actions";

export type Customer = CustomerWithStats;

interface CustomerTableProps {
  customers: CustomerWithStats[];
  loading: boolean;
  onEditClick: (customer: CustomerWithStats) => void;
  onDeleteClick: (customer: CustomerWithStats) => void;
  formatCurrency: (value: number | string) => string;
}

export function CustomerTable({
  customers,
  loading,
  onEditClick,
  onDeleteClick,
  formatCurrency,
}: CustomerTableProps) {
  // Format Date helper
  const formatDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && customers.length === 0) {
    return (
      <Card className="border border-slate-200 bg-white overflow-hidden p-8 shadow-xs">
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-sm font-medium">Loading customer profiles...</p>
        </div>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="border border-slate-200 bg-white overflow-hidden p-8 text-center shadow-xs">
        <div className="py-12 space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No customer profiles match your search criteria. Add a new customer to start managing their expenses.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs flex-initial flex flex-col min-h-0">
      {/* Desktop / Tablet Table View */}
      <div className="overflow-auto flex-1 min-h-0 hidden md:block">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-slate-150 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-2xs">
              <th className="px-6 py-4 text-left w-[100px]">Actions</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Mobile</th>
              <th className="px-6 py-4 text-right">Monthly Budget</th>
              <th className="px-6 py-4 text-right">Total Expenses</th>
              <th className="px-6 py-4 text-right">Remaining Budget</th>
              <th className="px-6 py-4 text-center">Txns</th>
              <th className="px-6 py-4 text-right">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {customers.map((customer) => {
              const remainingNum = parseFloat(customer.remainingBudget);
              const isDeficit = remainingNum < 0;

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/60 transition-colors h-[60px]"
                >
                  {/* Actions */}
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClick(customer)}
                        title="Edit Customer"
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteClick(customer)}
                        title="Delete Customer"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>

                  {/* Customer Name & Nickname */}
                  <td className="px-6 py-3 font-medium text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-bold">{customer.name}</span>
                      {customer.nickname && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-normal">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span>{customer.nickname}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-3 text-slate-600">
                    {customer.phone ? (
                      <span className="font-mono text-xs">{customer.phone}</span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">-</span>
                    )}
                  </td>

                  {/* Monthly Budget */}
                  <td className="px-6 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(customer.monthlyBudget)}
                  </td>

                  {/* Total Expenses */}
                  <td className="px-6 py-3 text-right font-semibold text-rose-600">
                    {formatCurrency(customer.totalExpenses)}
                  </td>

                  {/* Remaining Budget */}
                  <td className="px-6 py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                        isDeficit
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      )}
                    >
                      {formatCurrency(customer.remainingBudget)}
                    </span>
                  </td>

                  {/* Total Transactions */}
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {customer.transactionCount}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-3 text-right text-xs text-slate-500">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden divide-y divide-slate-100">
        {customers.map((customer) => {
          const remainingNum = parseFloat(customer.remainingBudget);
          const isDeficit = remainingNum < 0;

          return (
            <div key={customer.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{customer.name}</h4>
                  {customer.nickname && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Tag className="h-3 w-3" />
                      <span>{customer.nickname}</span>
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick(customer)}
                    className="h-8 w-8 text-slate-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteClick(customer)}
                    className="h-8 w-8 text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Monthly Budget</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(customer.monthlyBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Expenses</span>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(customer.totalExpenses)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-medium">Remaining Budget:</span>
                  <span
                    className={cn(
                      "font-bold px-2 py-0.5 rounded text-xs",
                      isDeficit ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {formatCurrency(customer.remainingBudget)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{customer.transactionCount} transactions</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
