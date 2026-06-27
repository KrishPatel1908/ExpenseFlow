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
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium self-start sm:self-auto gap-2"
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
          className="pl-10 w-full bg-white border-slate-200 focus-visible:ring-indigo-500"
        />
      </div>

      {/* Main Customers List Grid */}
      <div>
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <Card className="border border-slate-200 bg-white text-center py-16 text-slate-500">
            <p className="text-sm">No customers found.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
              const initials = customer.name.slice(0, 2).toUpperCase();
              return (
                <Card
                  key={customer.id}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="group relative flex flex-col justify-between border border-slate-200 bg-white p-6 shadow-xs rounded-xl hover:-translate-y-1.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm">
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {customer.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(customer);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer.id, customer.name);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Budgets details */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-500 font-medium">Monthly Budget</span>
                        <p className="font-semibold text-slate-900">{formatCurrency(customer.monthlyBudget)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-500 font-medium">Yearly Budget</span>
                        <p className="font-semibold text-slate-900">{formatCurrency(customer.yearlyBudget)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hover indicator link */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-6 group-hover:text-indigo-600 transition-colors">
                    <span className="font-medium">View Analysis Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
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
