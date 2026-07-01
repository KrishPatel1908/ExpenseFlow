"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Edit2, Loader2, Phone, User, Download } from "lucide-react";
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

  // Helper to generate Customer PDF structure
  const generateCustomerPDF = async (dataToExport: Customer[], title: string) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW  = 210;
    const mL     = 12;   // left margin
    const tableW = pageW - mL * 2;

    // Calculate totals
    const totalCredit = dataToExport.reduce((sum, cust) => {
      const bal = parseFloat(cust.netBalance);
      return bal > 0 ? sum + bal : sum;
    }, 0);
    const totalDebit = dataToExport.reduce((sum, cust) => {
      const bal = parseFloat(cust.netBalance);
      return bal < 0 ? sum + Math.abs(bal) : sum;
    }, 0);
    const netBalance = totalCredit - totalDebit;

    const rs = (val: number) => `Rs. ${Math.abs(val).toLocaleString("en-IN")}`;

    // ── 1. HEADER (White background with dark slate text) ──────────
    doc.setTextColor(11, 19, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ExpenseFlow", mL, 11);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(title, mL + 32, 11);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("All Customers", mL, 18);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageW - mL, 18, { align: "right" });

    // Clean header underline
    doc.setDrawColor(226, 232, 240);
    doc.line(mL, 21, pageW - mL, 21);

    // ── 2. SUMMARY STRIP (Tighter minimal spacing, white background) ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL CUSTOMERS",  mL,       26);
    doc.text("TOTAL PAYABLE (CR)",  78,    26);
    doc.text("TOTAL RECEIVABLE (DR)", 134, 26);
    doc.text("NET BALANCE",   pageW - mL, 26, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.setTextColor(11, 19, 42);
    doc.text(String(dataToExport.length), mL, 31);

    doc.setTextColor(195, 28, 28);
    doc.text(rs(totalCredit), 78, 31);

    doc.setTextColor(4, 128, 80);
    doc.text(rs(totalDebit), 134, 31);

    const netColor = netBalance >= 0 ? [195, 28, 28] : [4, 128, 80];
    doc.setTextColor(netColor[0], netColor[1], netColor[2]);
    doc.text(
      rs(netBalance),
      pageW - mL, 31, { align: "right" }
    );

    // Summary section divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(mL, 35, pageW - mL, 35);

    // ── 3. TABLE ───────────────────────────────────────────────────
    const cols = [
      { label: "Customer Name",   x: mL,      w: 80 },
      { label: "Mobile Number",   x: 95,      w: 50 },
      { label: "Net Balance",     x: 155,     w: 43 },
    ];

    const rowH = 7;
    let y = 44;

    const drawHeader = () => {
      doc.setFillColor(11, 19, 42);
      doc.rect(mL, y - 5, tableW, rowH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      cols.forEach(col => doc.text(col.label, col.x, y));
      y += rowH;
    };

    drawHeader();

    dataToExport.forEach((cust, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 16;
        drawHeader();
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(mL, y + 2.5, mL + tableW, y + 2.5);

      const bal = parseFloat(cust.netBalance);
      const isCr = bal > 0;

      const rowData = [
        cust.name.slice(0, 42),
        cust.phone || "-",
        rs(bal),
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);

      rowData.forEach((val, i) => {
        if (i === 2) {
          doc.setTextColor(isCr ? 195 : 4, isCr ? 28 : 128, isCr ? 28 : 80);
        } else {
          doc.setTextColor(30, 41, 59);
        }
        doc.text(String(val), cols[i].x, y);
      });

      y += rowH;
    });

    // ── 4. FOOTER ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("ExpenseFlow - Customer Report", mL, 293);
      doc.text(`Page ${p} of ${pageCount}`, pageW - mL, 293, { align: "right" });
    }

    return doc;
  };

  const handleExportPDF = async () => {
    if (filteredCustomers.length === 0) {
      toast.error("No customers to export.");
      return;
    }
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });
      const doc = await generateCustomerPDF(filteredCustomers, "Customer Record");
      toast.dismiss("pdf-gen");
      doc.save(`customers-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.dismiss("pdf-gen");
      console.error(err);
      toast.error("Failed to generate PDF.");
    }
  };

  const handleShareWhatsApp = async () => {
    if (filteredCustomers.length === 0) {
      toast.error("No customers to share.");
      return;
    }
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });
      const doc = await generateCustomerPDF(filteredCustomers, "Filtered Customer Record");
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], `customers-${new Date().toISOString().split("T")[0]}.pdf`, { type: "application/pdf" });
      toast.dismiss("pdf-gen");

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: "Customer Report - ExpenseFlow",
          text: "Filtered Customer Record",
        });
        toast.success("PDF shared successfully!");
      } else {
        toast.error("Sharing not supported on this device/browser.");
      }
    } catch (err) {
      toast.dismiss("pdf-gen");
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Failed to generate or share PDF.");
      }
    }
  };

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
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Download PDF button — Desktop & Mobile */}
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium gap-2 cursor-pointer"
            disabled={filteredCustomers.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>

          {/* WhatsApp Share Button — Mobile Only (hidden on desktop via CSS) */}
          <Button
            onClick={handleShareWhatsApp}
            variant="outline"
            disabled={filteredCustomers.length === 0}
            className="sm:hidden border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] font-medium gap-2 cursor-pointer"
            id="whatsapp-share-btn"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Share via WhatsApp</span>
          </Button>
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
