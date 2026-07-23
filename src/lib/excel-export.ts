import { toast } from "sonner";

export interface ExpenseForExcel {
  customerName: string;
  customerPhone?: string | null;
  category: string | null;
  credit: string;
  debit: string;
  netBalance: string;
  date: Date | string;
  note: string | null;
}

export interface CustomerForExcel {
  name: string;
  phone?: string | null;
  netBalance: string;
}

/**
 * Exports transaction history to an Excel-compatible CSV file.
 * Automatically formats numeric fields and net balance signs.
 */
export function exportExpensesExcel(
  data: ExpenseForExcel[],
  filename: string,
  startDate?: string,
  endDate?: string,
  typeFilter?: string,
  categoryFilter?: string,
  searchQuery?: string
) {
  if (data.length === 0) {
    toast.error("No transactions to export.");
    return;
  }

  try {
    toast.loading("Generating Excel...", { id: "excel-gen" });

    // Header fields
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Date",
      "Credit In (Receipt)",
      "Debit Out (Payment)",
      "Net Balance",
      "Category",
      "Note"
    ];

    // Format rows
    const rows = data.map(item => {
      const creditVal = parseFloat(item.credit) || 0;
      const debitVal = parseFloat(item.debit) || 0;
      const netVal = parseFloat(item.netBalance) || 0;

      // Net balance color logic: Red/debit remains (> 0) -> negative; Green/credit remains (< 0) -> positive
      const formattedNet = netVal > 0 ? -Math.abs(netVal) : Math.abs(netVal);

      return [
        item.customerName,
        item.customerPhone || "-",
        new Date(item.date).toLocaleDateString("en-IN"),
        creditVal > 0 ? creditVal : 0,
        debitVal > 0 ? debitVal : 0,
        formattedNet,
        item.category || "Uncategorized",
        item.note || "-"
      ];
    });

    // Create CSV rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')
          ? `"${stringVal}"`
          : stringVal;
      }).join(","))
    ].join("\r\n");

    // Add UTF-8 BOM so Excel decodes cell data correctly
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.dismiss("excel-gen");
    toast.success("Excel exported successfully!");
  } catch (error) {
    toast.dismiss("excel-gen");
    console.error("Excel export error:", error);
    toast.error("Failed to generate Excel.");
  }
}

/**
 * Exports customer profiles with balances to an Excel-compatible CSV file.
 */
export function exportCustomersExcel(
  data: CustomerForExcel[],
  filename: string,
  searchQuery?: string
) {
  if (data.length === 0) {
    toast.error("No customers to export.");
    return;
  }

  try {
    toast.loading("Generating Excel...", { id: "excel-gen" });

    // Header fields
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Net Balance"
    ];

    // Format rows
    const rows = data.map(item => {
      const netVal = parseFloat(item.netBalance) || 0;
      const formattedNet = netVal > 0 ? -Math.abs(netVal) : Math.abs(netVal);

      return [
        item.name,
        item.phone || "-",
        formattedNet
      ];
    });

    // Create CSV rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')
          ? `"${stringVal}"`
          : stringVal;
      }).join(","))
    ].join("\r\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.dismiss("excel-gen");
    toast.success("Excel exported successfully!");
  } catch (error) {
    toast.dismiss("excel-gen");
    console.error("Excel export error:", error);
    toast.error("Failed to generate Excel.");
  }
}

/**
 * Shares transaction history Excel-compatible CSV via WhatsApp (Web Share API).
 */
export async function shareExpensesExcelWhatsApp(
  data: ExpenseForExcel[],
  filename: string,
  startDate?: string,
  endDate?: string,
  typeFilter?: string,
  categoryFilter?: string,
  searchQuery?: string
) {
  if (data.length === 0) {
    toast.error("No transactions to share.");
    return;
  }

  try {
    toast.loading("Generating Excel...", { id: "excel-share" });

    // Header fields
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Date",
      "Credit In (Receipt)",
      "Debit Out (Payment)",
      "Net Balance",
      "Category",
      "Note"
    ];

    // Format rows
    const rows = data.map(item => {
      const creditVal = parseFloat(item.credit) || 0;
      const debitVal = parseFloat(item.debit) || 0;
      const netVal = parseFloat(item.netBalance) || 0;
      const formattedNet = netVal > 0 ? -Math.abs(netVal) : Math.abs(netVal);

      return [
        item.customerName,
        item.customerPhone || "-",
        new Date(item.date).toLocaleDateString("en-IN"),
        creditVal > 0 ? creditVal : 0,
        debitVal > 0 ? debitVal : 0,
        formattedNet,
        item.category || "Uncategorized",
        item.note || "-"
      ];
    });

    // Create CSV rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')
          ? `"${stringVal}"`
          : stringVal;
      }).join(","))
    ].join("\r\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const file = new File([blob], filename, { type: "text/csv" });
    
    toast.dismiss("excel-share");

    if (typeof window !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Expense Report - ExpenseFlow",
        text: `Excel Expense report`,
      });
      toast.success("Excel shared successfully!");
    } else {
      toast.error("Sharing not supported on this device/browser.");
    }
  } catch (error) {
    toast.dismiss("excel-share");
    console.error("Excel share error:", error);
    toast.error("Failed to share Excel.");
  }
}

/**
 * Shares customer profiles Excel-compatible CSV via WhatsApp (Web Share API).
 */
export async function shareCustomersExcelWhatsApp(
  data: CustomerForExcel[],
  filename: string,
  searchQuery?: string
) {
  if (data.length === 0) {
    toast.error("No customers to share.");
    return;
  }

  try {
    toast.loading("Generating Excel...", { id: "excel-share" });

    // Header fields
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Net Balance"
    ];

    // Format rows
    const rows = data.map(item => {
      const netVal = parseFloat(item.netBalance) || 0;
      const formattedNet = netVal > 0 ? -Math.abs(netVal) : Math.abs(netVal);

      return [
        item.name,
        item.phone || "-",
        formattedNet
      ];
    });

    // Create CSV rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')
          ? `"${stringVal}"`
          : stringVal;
      }).join(","))
    ].join("\r\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const file = new File([blob], filename, { type: "text/csv" });
    
    toast.dismiss("excel-share");

    if (typeof window !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Customer Report - ExpenseFlow",
        text: `Excel Customer report`,
      });
      toast.success("Excel shared successfully!");
    } else {
      toast.error("Sharing not supported on this device/browser.");
    }
  } catch (error) {
    toast.dismiss("excel-share");
    console.error("Excel share error:", error);
    toast.error("Failed to share Excel.");
  }
}

