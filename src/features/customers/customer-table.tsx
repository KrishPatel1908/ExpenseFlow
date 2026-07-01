import { Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  netBalance: string;
}

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  filteredCustomers: Customer[];
  onEditClick: (customer: Customer) => void;
  onDeleteClick: (customer: Customer) => void;
  formatCurrency: (value: number | string) => string;
}

export function CustomerTable({
  customers,
  loading,
  filteredCustomers,
  onEditClick,
  onDeleteClick,
  formatCurrency,
}: CustomerTableProps) {
  return (
    <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="overflow-auto max-h-[530px] sm:max-h-[480px]">
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            <p className="text-sm">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No customers found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-full">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-150 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-2xs">
                <th className="px-6 py-4 text-left w-[15%]">Actions</th>
                <th className="px-6 py-4 w-[30%]">Customer</th>
                <th className="px-6 py-4 w-[30%]">Mobile</th>
                <th className="px-6 py-4 text-slate-800 font-bold w-[25%]">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredCustomers.map((customer) => {
                const netBal = parseFloat(customer.netBalance);
                const isCreditRemains = netBal > 0;
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/50 transition-colors h-[57px]"
                  >
                    <td className="px-6 py-3.5 text-left">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClick(customer)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(customer)}
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {customer.phone}
                    </td>
                    <td className={cn(
                      "px-6 py-3.5 font-bold",
                      isCreditRemains ? "text-red-600 bg-red-50/5" : "text-emerald-700 bg-emerald-50/5"
                    )}>
                      {formatCurrency(Math.abs(netBal))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
