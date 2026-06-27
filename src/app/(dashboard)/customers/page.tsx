"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Phone, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getCustomers, deleteCustomer } from "@/services/customer-actions";
import { CustomerForm } from "@/features/customers/customer-form";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  monthlyBudget: string;
  yearlyBudget: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const loadCustomers = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const data = await getCustomers(query);
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadCustomers]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"? All associated expenses will be permanently deleted.`)) {
      try {
        const result = await deleteCustomer(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Customer deleted successfully.");
          loadCustomers(searchQuery);
        }
      } catch (error) {
        toast.error("Failed to delete customer.");
      }
    }
  };

  const handleEditClick = (customer: any) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(parseFloat(value));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage and track your customer budget allocations.</p>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-slate-950 hover:bg-slate-900 text-white font-medium self-start sm:self-auto gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full bg-white border-slate-200 focus-visible:ring-slate-950"
        />
      </div>

      {/* Main Customers List Grid */}
      <div>
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            <p className="text-sm">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <Card className="border border-slate-200 bg-white text-center py-16 text-slate-500">
            <p className="text-sm">No customers found.</p>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1">
            {customers.map((customer) => {
              const initials = customer.name.slice(0, 2).toUpperCase();
              return (
                <Card
                  key={customer.id}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="group relative grid grid-cols-1 md:grid-cols-12 items-center gap-4 border border-slate-200 bg-white p-6 shadow-xs rounded-xl hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-350 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Left Section: Avatar + Identity */}
                  <div className="md:col-span-4 flex items-center gap-4 shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-800 group-hover:text-slate-950 transition-colors text-base tracking-tight truncate">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{customer.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle Section: Budgets */}
                  <div className="md:col-span-5 flex flex-row gap-6 my-2 md:my-0 text-xs justify-start md:justify-center">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 px-4 py-2.5 rounded-xl space-y-0.5 min-w-[130px]">
                      <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Monthly Budget</span>
                      <p className="font-extrabold text-emerald-950 text-sm">{formatCurrency(customer.monthlyBudget)}</p>
                    </div>
                    <div className="bg-sky-50/50 border border-sky-100/50 px-4 py-2.5 rounded-xl space-y-0.5 min-w-[130px]">
                      <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider">Yearly Budget</span>
                      <p className="font-extrabold text-sky-950 text-sm">{formatCurrency(customer.yearlyBudget)}</p>
                    </div>
                  </div>

                  {/* Right Section: View Link + Actions */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-5 border-t border-slate-100 md:border-t-0 pt-4 md:pt-0">
                    {/* Hover Link */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-950 transition-colors">
                      <span>View Analysis</span>
                      <ArrowRight className="h-3.5 w-3.5 translate-x-0 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-950" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(customer);
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id, customer.name);
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingCustomer}
        onSuccess={() => loadCustomers(searchQuery)}
      />
    </div>
  );
}
