"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Download, ChevronDown, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
import { CustomerTable, type Customer } from "@/features/customers/customer-table";
import { exportCustomersPDF, shareCustomersPDFWhatsApp } from "@/lib/pdf-export";
import { exportCustomersExcel } from "@/lib/excel-export";
import { toast } from "sonner";

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

  // Export Dropdown State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Export handlers
  const getFilterDesc = () => {
    return searchQuery ? `Search: "${searchQuery}"` : "";
  };

  const handleExportPDF = () => {
    exportCustomersPDF(
      filteredCustomers,
      getFilterDesc(),
      `customers-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportExcel = () => {
    exportCustomersExcel(
      filteredCustomers,
      `customers-${new Date().toISOString().split("T")[0]}.csv`,
      searchQuery
    );
  };

  const handleShareWhatsApp = () => {
    shareCustomersPDFWhatsApp(
      filteredCustomers,
      getFilterDesc()
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6 pb-2 sm:pb-0">
      {/* Dynamic Style Injection to lock layouts only for this page */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          height: 100% !important;
          overflow: hidden !important;
        }
        main {
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        main > div {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          width: 100% !important;
        }
      `}} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage unique customer profiles and view their net balances.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", exportDropdownOpen && "rotate-180")} />
            </Button>

            {exportDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* 1. Mobile WhatsApp Option (TOP OF THE LIST ON MOBILE ONLY) */}
                <div className="block sm:hidden border-b border-slate-100 pb-1.5 mb-1.5">
                  <button
                    onClick={() => {
                      handleShareWhatsApp();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Share via WhatsApp</span>
                  </button>
                </div>

                {/* 2. Download Options */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Main Customers Table component */}
      <CustomerTable
        customers={customers}
        loading={loading}
        filteredCustomers={filteredCustomers}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        formatCurrency={formatCurrency}
      />

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
