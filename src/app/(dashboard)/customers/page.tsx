"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayoutLock } from "@/components/page-layout-lock";
import { CustomerTable } from "@/features/customers/customer-table";
import { CustomerFilters } from "@/features/customers/customer-filters";
import { CustomerPagination } from "@/features/customers/customer-pagination";
import { CustomerExportDropdown } from "@/features/customers/customer-export-dropdown";
import { CustomerForm } from "@/features/customers/customer-form";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  getCustomers,
  createCustomer,
  updateCustomerProfile,
  deleteCustomerProfile,
  type CustomerWithStats,
} from "@/services/customer-actions";
import { type CustomerInput } from "@/schemas/customer";
import { toast } from "sonner";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof value === "string" ? parseFloat(value) : value);

export default function CustomersPage() {
  // Data States
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form & Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerWithStats | null>(null);

  // Debounce search query (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search query
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Customers Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      const res = await getCustomers({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      setCustomers(res.customers);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      setHasError(true);
      toast.error("Failed to load customer profiles. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Handlers for Form & Actions
  const handleAddClick = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (customer: CustomerWithStats) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (customer: CustomerWithStats) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CustomerInput) => {
    if (editingCustomer) {
      return await updateCustomerProfile(editingCustomer.id, data);
    }
    return await createCustomer(data);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      const res = await deleteCustomerProfile(customerToDelete.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Customer profile deleted successfully.");
        loadData();
      }
    } catch {
      toast.error("Failed to delete customer profile.");
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
          <p className="text-slate-500 mt-1">
            Manage customer profiles, monthly budgets, and tracked expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <CustomerExportDropdown
            customers={customers}
            filteredCustomers={customers}
            searchQuery={searchQuery}
            isFilterApplied={searchQuery !== ""}
          />

          <Button
            onClick={handleAddClick}
            className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-medium gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Search & Sorting Filters */}
      <CustomerFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onReset={() => setSearchQuery("")}
      />

      {/* Error State with Retry Button */}
      {hasError ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-rose-100 p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <h3 className="text-base font-bold text-slate-900">Failed to Load Customers</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Could not fetch customer data from the database. Please check your network connection and retry.
          </p>
          <Button
            onClick={loadData}
            variant="outline"
            className="gap-2 text-xs font-semibold cursor-pointer border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Loading</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Main Table */}
          <CustomerTable
            customers={customers}
            loading={loading}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            formatCurrency={formatCurrency}
          />

          {/* Server-Side Pagination */}
          <CustomerPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </>
      )}

      {/* Reusable Customer Form Modal */}
      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingCustomer}
        onSubmit={handleFormSubmit}
        onSuccess={loadData}
      />

      {/* Confirmation Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirm Customer Deletion"
        description={`Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Customer"
        isSubmitting={false}
      />
    </div>
  );
}
