"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageLayoutLock } from "@/components/page-layout-lock";
import { CustomerTable, type Customer } from "@/features/customers/customer-table";
import { CustomerExportDropdown } from "@/features/customers/customer-export-dropdown";
import { EditCustomerDialog } from "@/features/customers/edit-customer-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useCustomersPage } from "@/features/customers/use-customers-page";
import { deleteCustomer } from "@/services/expense-actions";
import { toast } from "sonner";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(typeof value === "string" ? parseFloat(value) : value);

export default function CustomersPage() {
  const {
    customers, loading,
    searchQuery, setSearchQuery,
    filteredCustomers, isFilterApplied,
    loadCustomers,
  } = useCustomersPage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const result = await deleteCustomer(customerToDelete.id);
      if (result.error) toast.error(result.error);
      else { toast.success("Customer and all related transactions deleted successfully."); loadCustomers(); }
    } catch {
      toast.error("Failed to delete customer.");
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6 pb-2 sm:pb-0">
      <PageLayoutLock />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage unique customer profiles and view their net balances.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <CustomerExportDropdown
            customers={customers}
            filteredCustomers={filteredCustomers}
            searchQuery={searchQuery}
            isFilterApplied={isFilterApplied}
          />
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

      <CustomerTable
        customers={customers}
        loading={loading}
        filteredCustomers={filteredCustomers}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        formatCurrency={formatCurrency}
      />

      <EditCustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customerToEdit}
        onSuccess={loadCustomers}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete "${customerToDelete?.name}"? Warning: This will also permanently delete all transaction history associated with this customer. This action cannot be undone.`}
        confirmText="Delete"
        isSubmitting={false}
      />
    </div>
  );
}
