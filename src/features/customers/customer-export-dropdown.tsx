"use client";

import { useState, useEffect, useRef } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportCustomersPDF, shareCustomersPDFWhatsApp } from "@/lib/pdf-export";
import { exportCustomersExcel, shareCustomersExcelWhatsApp } from "@/lib/excel-export";
import type { CustomerWithStats } from "@/services/customer-actions";

interface CustomerExportDropdownProps {
  customers: CustomerWithStats[];
  filteredCustomers: CustomerWithStats[];
  searchQuery: string;
  isFilterApplied: boolean;
}

export function CustomerExportDropdown({
  customers,
  filteredCustomers,
  searchQuery,
  isFilterApplied
}: CustomerExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pinnedFormat, setPinnedFormat] = useState<"pdf" | "excel" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load pinned default export format from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("expenseflow_default_export_format");
    if (saved === "pdf" || saved === "excel") {
      setPinnedFormat(saved);
    }
  }, []);

  const handlePin = (format: "pdf" | "excel", e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedFormat === format) {
      setPinnedFormat(null);
      localStorage.removeItem("expenseflow_default_export_format");
      toast.success("Default export pin removed");
    } else {
      setPinnedFormat(format);
      localStorage.setItem("expenseflow_default_export_format", format);
      toast.success(`Pinned ${format.toUpperCase()} as default export format`);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFilterDesc = () => {
    if (!isFilterApplied) return "All Customers";
    if (searchQuery) return `Search: "${searchQuery}"`;
    return "Filtered Customers";
  };

  const mapToExport = (list: CustomerWithStats[]) =>
    list.map((c) => ({
      name: c.name,
      phone: c.phone,
      netBalance: c.remainingBudget || "0",
    }));

  const handleExportPDF = () => {
    exportCustomersPDF(
      mapToExport(filteredCustomers),
      getFilterDesc(),
      `customers-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportAllPDF = () => {
    exportCustomersPDF(
      mapToExport(customers),
      "All Customers",
      `customers-all-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportExcel = () => {
    exportCustomersExcel(
      mapToExport(filteredCustomers),
      `customers-${new Date().toISOString().split("T")[0]}.csv`,
      searchQuery
    );
  };

  const handleExportAllExcel = () => {
    exportCustomersExcel(
      mapToExport(customers),
      `customers-all-${new Date().toISOString().split("T")[0]}.csv`,
      ""
    );
  };

  const handleShareWhatsApp = () => {
    shareCustomersPDFWhatsApp(
      mapToExport(filteredCustomers),
      getFilterDesc()
    );
  };

  const handleShareAllPDFWhatsApp = () => {
    shareCustomersPDFWhatsApp(
      mapToExport(customers),
      "All Customers"
    );
  };

  const handleShareExcelWhatsApp = () => {
    shareCustomersExcelWhatsApp(
      mapToExport(filteredCustomers),
      `customers-${new Date().toISOString().split("T")[0]}.csv`,
      searchQuery
    );
  };

  const handleShareAllExcelWhatsApp = () => {
    shareCustomersExcelWhatsApp(
      mapToExport(customers),
      `customers-all-${new Date().toISOString().split("T")[0]}.csv`,
      ""
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 cursor-pointer font-medium"
      >
        <Download className="h-4 w-4 text-slate-500" />
        <span>Export</span>
        {pinnedFormat && (
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">
            {pinnedFormat}
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
            Export Options {isFilterApplied && "(Filtered)"}
          </div>

          <div className="space-y-1">
            {/* PDF Section */}
            <div className="group relative flex items-center justify-between hover:bg-slate-50 rounded-lg pr-2 transition-colors">
              <button
                type="button"
                onClick={() => {
                  handleExportPDF();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 font-medium text-left cursor-pointer"
              >
                <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span>Export as PDF</span>
                  <span className="text-[10px] text-slate-400 font-normal">Formatted print report</span>
                </div>
              </button>

              <button
                type="button"
                onClick={(e) => handlePin("pdf", e)}
                title={pinnedFormat === "pdf" ? "Unpin default format" : "Pin as default export format"}
                className={cn(
                  "p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer",
                  pinnedFormat === "pdf" ? "text-blue-600 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100"
                )}
              >
                <Pin className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>

            {/* Excel Section */}
            <div className="group relative flex items-center justify-between hover:bg-slate-50 rounded-lg pr-2 transition-colors">
              <button
                type="button"
                onClick={() => {
                  handleExportExcel();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 font-medium text-left cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col">
                  <span>Export as Excel (CSV)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Spreadsheet compatible</span>
                </div>
              </button>

              <button
                type="button"
                onClick={(e) => handlePin("excel", e)}
                title={pinnedFormat === "excel" ? "Unpin default format" : "Pin as default export format"}
                className={cn(
                  "p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer",
                  pinnedFormat === "excel" ? "text-blue-600 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100"
                )}
              >
                <Pin className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Separate section for All Customers export when filters are active */}
          {isFilterApplied && (
            <>
              <div className="my-1.5 border-t border-slate-100" />
              <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Full Database Export
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleExportAllPDF();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Export All Customers (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportAllExcel();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                  <span>Export All Customers (Excel)</span>
                </button>
              </div>
            </>
          )}

          {/* Share Section */}
          <div className="my-1.5 border-t border-slate-100" />
          <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
            Share via Mobile/App
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                handleShareWhatsApp();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              <span>Share PDF Report</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleShareExcelWhatsApp();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Share Excel File</span>
            </button>
            {isFilterApplied && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleShareAllPDFWhatsApp();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Share All Customers (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleShareAllExcelWhatsApp();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                  <span>Share All Customers (Excel)</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
