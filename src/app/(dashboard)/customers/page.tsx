"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Edit2, Loader2, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { getCustomersWithBalances, deleteCustomer, updateCustomer } from "@/services/expense-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  netBalance: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Delete Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Edit Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce effect for search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomersWithBalances();
      setCustomers(data);
    } catch {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers();
  }, [loadCustomers]);

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const result = await deleteCustomer(customerToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Customer and all related transactions deleted successfully.");
        loadCustomers();
      }
    } catch {
      toast.error("Failed to delete customer.");
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit) return;

    if (editName.trim().length < 2) {
      toast.error("Customer name must be at least 2 characters.");
      return;
    }
    if (editPhone.trim().length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCustomer(customerToEdit.id, editName, editPhone);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Customer updated successfully!");
        setEditDialogOpen(false);
        setCustomerToEdit(null);
        loadCustomers();
      }
    } catch {
      toast.error("Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage unique customer profiles and view their net balances.</p>
        </div>
      </div>

      {/* Search Input */}
      <Card className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-slate-200 rounded-full bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0b132a] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </Card>

      {/* Main Customers Table */}
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
                  <th className="px-6 py-4 text-left w-28">Actions</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4 text-slate-800 font-bold">Net Balance</th>
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
                            onClick={() => handleEditClick(customer)}
                            className="h-8 w-8 text-slate-500 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(customer)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
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

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  {"Update the customer's name and mobile number. Changes will reflect instantly across all transactions."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editName" className="text-slate-700 font-bold">Customer Name</Label>
                  <Input
                    id="editName"
                    type="text"
                    placeholder="Enter name..."
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editPhone" className="text-slate-700 font-bold">Mobile Number</Label>
                  <Input
                    id="editPhone"
                    type="tel"
                    placeholder="10-digit mobile..."
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-10 text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setCustomerToEdit(null);
                }}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-slate-900">Delete Customer</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Are you sure you want to delete <span className="font-bold text-slate-950">&quot;{customerToDelete?.name}&quot;</span>?
              <br />
              <span className="text-red-600 font-semibold">Warning: This will also permanently delete all transaction history associated with this customer.</span> This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCustomerToDelete(null);
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
    </div>
  );
}
