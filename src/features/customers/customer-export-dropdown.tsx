"use client";

import { useState, useEffect, useRef } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportCustomersPDF, shareCustomersPDFWhatsApp } from "@/lib/pdf-export";
import { exportCustomersExcel, shareCustomersExcelWhatsApp } from "@/lib/excel-export";

import { type Customer } from "./customer-table";

interface CustomerExportDropdownProps {
  customers: Customer[];
  filteredCustomers: Customer[];
  searchQuery: string;
  isFilterApplied: boolean;
}

export function CustomerExportDropdown({
  customers,
  filteredCustomers,
  searchQuery,
  isFilterApplied
}: CustomerExportDropdownProps) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportTab, setExportTab] = useState<"pdf" | "excel">("pdf");
  const [pinnedTab, setPinnedTab] = useState<"pdf" | "excel">("pdf");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/services/auth-actions").then(({ getDefaultExportFormat }) => {
      getDefaultExportFormat().then((saved) => {
        if (saved === "pdf" || saved === "excel") {
          setPinnedTab(saved);
          setExportTab(saved);
        }
      });
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePinTab = async (tab: "pdf" | "excel") => {
    setPinnedTab(tab);
    try {
      const { setDefaultExportFormat } = await import("@/services/auth-actions");
      const res = await setDefaultExportFormat(tab);
      if (res.success) {
        toast.success(`Pinned ${tab.toUpperCase()} as default export format in your profile!`);
      } else {
        toast.error(res.error || "Failed to update pin preference.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update pin preference.");
    }
  };

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

  const handleExportAllPDF = () => {
    exportCustomersPDF(
      customers,
      "All Customers",
      `customers-all-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportExcel = () => {
    exportCustomersExcel(
      filteredCustomers,
      `customers-${new Date().toISOString().split("T")[0]}.csv`,
      searchQuery
    );
  };

  const handleExportAllExcel = () => {
    exportCustomersExcel(
      customers,
      `customers-all-${new Date().toISOString().split("T")[0]}.csv`,
      ""
    );
  };

  const handleShareWhatsApp = () => {
    shareCustomersPDFWhatsApp(
      filteredCustomers,
      getFilterDesc()
    );
  };

  const handleShareAllPDFWhatsApp = () => {
    shareCustomersPDFWhatsApp(
      customers,
      "All Customers"
    );
  };

  const handleShareExcelWhatsApp = () => {
    shareCustomersExcelWhatsApp(
      filteredCustomers,
      `customers-${new Date().toISOString().split("T")[0]}.csv`,
      searchQuery
    );
  };

  const handleShareAllExcelWhatsApp = () => {
    shareCustomersExcelWhatsApp(
      customers,
      `customers-all-${new Date().toISOString().split("T")[0]}.csv`,
      ""
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => {
          if (!exportDropdownOpen) {
            setExportTab(pinnedTab);
          }
          setExportDropdownOpen(!exportDropdownOpen);
        }}
        variant="outline"
        className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-955 font-medium gap-2 cursor-pointer"
      >
        <Download className="h-4 w-4" />
        <span>Export</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", exportDropdownOpen && "rotate-180")} />
      </Button>

      {exportDropdownOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[220px] sm:w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Mobile View: Segmented tabs and actions */}
          <div className="block sm:hidden p-1 w-full">
            <div className="flex rounded-lg bg-slate-100 p-0.5 mb-2">
              <button
                type="button"
                onClick={() => setExportTab("pdf")}
                className={cn(
                  "flex items-center justify-center gap-1 flex-1 rounded-md py-1 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer relative",
                  exportTab === "pdf"
                    ? "bg-white text-[#0b132a] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>PDF</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinTab("pdf");
                  }}
                  className="p-0.5 rounded hover:bg-slate-200/50 cursor-pointer ml-1"
                  title="Pin PDF"
                >
                  <Pin className={cn("h-3 w-3", pinnedTab === "pdf" ? "fill-[#0b132a] text-[#0b132a]" : "text-slate-400")} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExportTab("excel")}
                className={cn(
                  "flex items-center justify-center gap-1 flex-1 rounded-md py-1 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer relative",
                  exportTab === "excel"
                    ? "bg-white text-[#0b132a] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Excel</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinTab("excel");
                  }}
                  className="p-0.5 rounded hover:bg-slate-200/50 cursor-pointer ml-1"
                  title="Pin Excel"
                >
                  <Pin className={cn("h-3 w-3", pinnedTab === "excel" ? "fill-[#0b132a] text-[#0b132a]" : "text-slate-400")} />
                </span>
              </button>
            </div>

            <div className="space-y-0.5">
              {exportTab === "pdf" ? (
                <>
                  <button
                    onClick={() => {
                      if (isFilterApplied) {
                        handleShareWhatsApp();
                      } else {
                        handleShareAllPDFWhatsApp();
                      }
                      setExportDropdownOpen(false);
                    }}
                    disabled={isFilterApplied ? filteredCustomers.length === 0 : customers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Share via WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>Export Filter</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportAllPDF();
                      setExportDropdownOpen(false);
                    }}
                    disabled={customers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>Export All</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (isFilterApplied) {
                        handleShareExcelWhatsApp();
                      } else {
                        handleShareAllExcelWhatsApp();
                      }
                      setExportDropdownOpen(false);
                    }}
                    disabled={isFilterApplied ? filteredCustomers.length === 0 : customers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Share via WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>Export Filter</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportAllExcel();
                      setExportDropdownOpen(false);
                    }}
                    disabled={customers.length === 0}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>Export All</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Desktop View: Single Column (Hidden on mobile) */}
          <div className="hidden sm:block">
            {/* PDF Section */}
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                PDF Reports
              </div>
            <button
              onClick={() => {
                handleExportPDF();
                setExportDropdownOpen(false);
              }}
              disabled={filteredCustomers.length === 0}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Export Filtered</span>
            </button>
            <button
              onClick={() => {
                handleExportAllPDF();
                setExportDropdownOpen(false);
              }}
              disabled={customers.length === 0}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Export All</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Excel Section */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Excel Spreadsheets
            </div>
            <button
              onClick={() => {
                handleExportExcel();
                setExportDropdownOpen(false);
              }}
              disabled={filteredCustomers.length === 0}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
              <span>Export Filtered</span>
            </button>
            <button
              onClick={() => {
                handleExportAllExcel();
                setExportDropdownOpen(false);
              }}
              disabled={customers.length === 0}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
              <span>Export All</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
