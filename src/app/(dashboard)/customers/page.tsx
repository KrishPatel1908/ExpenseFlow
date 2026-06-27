"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Phone, DollarSign, Loader2 } from "lucide-react";
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

      {/* Main Customers List */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading && customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No customers found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4 text-right">Monthly Budget</th>
                  <th className="px-6 py-4 text-right">Yearly Budget</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {customers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(customer.monthlyBudget)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(customer.yearlyBudget)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(customer)}
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id, customer.name)}
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
