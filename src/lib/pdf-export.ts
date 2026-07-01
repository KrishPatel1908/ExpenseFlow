import { toast } from "sonner";

export interface ExpenseForPDF {
  customerName: string;
  customerPhone?: string | null;
  category: string | null;
  credit: string;
  debit: string;
  netBalance: string;
  date: Date;
  note: string | null;
}

export interface CustomerForPDF {
  name: string;
  phone: string;
  netBalance: string;
}

// Helper to generate Expenses PDF
const generateExpensesPDFDocument = async (
  dataToExport: ExpenseForPDF[],
  startDate: string,
  endDate: string,
  title: string
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW  = 210;
  const mL     = 12;   // left margin
  const tableW = pageW - mL * 2;

  // Calculate totals
  const totalCr = dataToExport.reduce((sum, exp) => sum + parseFloat(exp.credit), 0);
  const totalDb = dataToExport.reduce((sum, exp) => sum + parseFloat(exp.debit), 0);
  const netBal = totalCr - totalDb;

  const rs = (val: number) => `Rs. ${Math.abs(val).toLocaleString("en-IN")}`;
  const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : "All dates";

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
  doc.text(`Period: ${dateRange}`, mL, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageW - mL, 18, { align: "right" });

  // Clean header underline
  doc.setDrawColor(226, 232, 240);
  doc.line(mL, 21, pageW - mL, 21);

  // ── 2. SUMMARY STRIP (Tighter minimal spacing, white background) ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTIONS",  mL,       26);
  doc.text("TOTAL CREDIT",  78,       26);
  doc.text("TOTAL DEBIT",   134,      26);
  doc.text("NET BALANCE",   pageW - mL, 26, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.setTextColor(11, 19, 42);
  doc.text(String(dataToExport.length), mL, 31);

  doc.setTextColor(195, 28, 28);
  doc.text(rs(totalCr), 78, 31);

  doc.setTextColor(4, 128, 80);
  doc.text(rs(totalDb), 134, 31);

  const netColor = netBal >= 0 ? [195, 28, 28] : [4, 128, 80];
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(
    rs(netBal),
    pageW - mL, 31, { align: "right" }
  );

  // Summary section divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(mL, 35, pageW - mL, 35);

  // ── 3. TABLE ───────────────────────────────────────────────────
  const cols = [
    { label: "Customer",  x: mL,   w: 36 },
    { label: "Mobile",    x: 50,   w: 26 },
    { label: "Date",      x: 78,   w: 22 },
    { label: "Credit",    x: 102,  w: 22 },
    { label: "Debit",     x: 126,  w: 22 },
    { label: "Net Bal",   x: 150,  w: 26 },
    { label: "Category",  x: 178,  w: 20 },
  ];

  const rowH = 7;
  let y = 44; // tighter starting point

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

  dataToExport.forEach((expense, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 16;
      drawHeader();
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(mL, y + 2.5, mL + tableW, y + 2.5);

    const net     = parseFloat(expense.netBalance);
    const creditV = parseFloat(expense.credit);
    const debitV  = parseFloat(expense.debit);

    const rowData = [
      expense.customerName.slice(0, 18),
      expense.customerPhone || "-",
      new Date(expense.date).toLocaleDateString("en-IN"),
      creditV > 0 ? creditV.toLocaleString("en-IN") : "-",
      debitV  > 0 ? debitV.toLocaleString("en-IN")  : "-",
      Math.abs(net).toLocaleString("en-IN"),
      (expense.category || "Uncategorized").slice(0, 13),
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);

    rowData.forEach((val, i) => {
      if      (i === 3 && creditV > 0) doc.setTextColor(195, 28, 28);
      else if (i === 4 && debitV  > 0) doc.setTextColor(4, 128, 80);
      else if (i === 5)                doc.setTextColor(net > 0 ? 195 : 4, net > 0 ? 28 : 128, net > 0 ? 28 : 80);
      else                             doc.setTextColor(30, 41, 59);
      doc.text(String(val), cols[i].x, y);
    });

    y += rowH;
  });

  // ── 3.5 TOTAL ROW (At bottom of table) ────────────────────────
  if (y > 275) {
    doc.addPage();
    y = 16;
    drawHeader();
  }

  // Draw separator line above totals
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(mL, y - 2.5, mL + tableW, y - 2.5);
  doc.setLineWidth(0.2); // reset line width

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  // "Total"
  doc.setTextColor(11, 19, 42);
  doc.text("Total", cols[0].x, y);

  // "-" for Mobile
  doc.setTextColor(148, 163, 184);
  doc.text("-", cols[1].x, y);

  // "-" for Date
  doc.text("-", cols[2].x, y);

  // Credit Total
  doc.setTextColor(195, 28, 28);
  doc.text(totalCr.toLocaleString("en-IN"), cols[3].x, y);

  // Debit Total
  doc.setTextColor(4, 128, 80);
  doc.text(totalDb.toLocaleString("en-IN"), cols[4].x, y);

  // Net Balance Total
  doc.setTextColor(netBal >= 0 ? 195 : 4, netBal >= 0 ? 28 : 128, netBal >= 0 ? 28 : 80);
  doc.text(Math.abs(netBal).toLocaleString("en-IN"), cols[5].x, y);

  // "-" for Category
  doc.setTextColor(148, 163, 184);
  doc.text("-", cols[6].x, y);

  // ── 4. FOOTER ─────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("ExpenseFlow - Expense Report", mL, 293);
    doc.text(`Page ${p} of ${pageCount}`, pageW - mL, 293, { align: "right" });
  }

  return doc;
};

// Exported function to download Expenses PDF
export const exportExpensesPDF = async (
  dataToExport: ExpenseForPDF[],
  startDate: string,
  endDate: string,
  title: string,
  filename: string
) => {
  if (dataToExport.length === 0) {
    toast.error("No data to export.");
    return;
  }
  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    const doc = await generateExpensesPDFDocument(dataToExport, startDate, endDate, title);
    toast.dismiss("pdf-gen");
    doc.save(filename);
    toast.success("PDF exported successfully!");
  } catch (err) {
    toast.dismiss("pdf-gen");
    console.error(err);
    toast.error("Failed to generate PDF.");
  }
};

// Exported function to share Expenses PDF via WhatsApp
export const shareExpensesPDFWhatsApp = async (
  dataToExport: ExpenseForPDF[],
  startDate: string,
  endDate: string,
  title: string
) => {
  if (dataToExport.length === 0) {
    toast.error("No expenses to share.");
    return;
  }

  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    const doc = await generateExpensesPDFDocument(dataToExport, startDate, endDate, title);
    const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : "All dates";

    const pdfBlob = doc.output("blob");
    const pdfFile = new File(
      [pdfBlob],
      `expenses-${dateRange.replace(/\s/g, "-")}.pdf`,
      { type: "application/pdf" }
    );

    toast.dismiss("pdf-gen");

    if (typeof window !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: "Expense Report - ExpenseFlow",
        text: `Expense report for ${dateRange}`,
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

// Helper to generate Customer PDF
const generateCustomerPDFDocument = async (dataToExport: CustomerForPDF[], title: string) => {
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
  doc.text("TOTAL CREDIT",  78,    26);
  doc.text("TOTAL DEBIT", 134, 26);
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
    { label: "Customer Name",   x: mL,      w: 70 },
    { label: "Mobile Number",   x: 82,      w: 70 },
    { label: "Net Balance",     x: 152,     w: 46 },
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

// Exported function to download Customers PDF
export const exportCustomersPDF = async (
  dataToExport: CustomerForPDF[],
  title: string,
  filename: string
) => {
  if (dataToExport.length === 0) {
    toast.error("No customers to export.");
    return;
  }
  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    const doc = await generateCustomerPDFDocument(dataToExport, title);
    toast.dismiss("pdf-gen");
    doc.save(filename);
    toast.success("PDF downloaded successfully!");
  } catch (err) {
    toast.dismiss("pdf-gen");
    console.error(err);
    toast.error("Failed to generate PDF.");
  }
};

// Exported function to share Customers PDF via WhatsApp
export const shareCustomersPDFWhatsApp = async (
  dataToExport: CustomerForPDF[],
  title: string
) => {
  if (dataToExport.length === 0) {
    toast.error("No customers to share.");
    return;
  }
  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    const doc = await generateCustomerPDFDocument(dataToExport, title);
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `customers-${new Date().toISOString().split("T")[0]}.pdf`, { type: "application/pdf" });
    toast.dismiss("pdf-gen");

    if (typeof window !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: "Customer Report - ExpenseFlow",
        text: title,
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
