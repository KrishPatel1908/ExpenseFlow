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
  const netBal = totalDb - totalCr;

  const rs = (val: number) => `Rs. ${Math.abs(val).toLocaleString("en-IN")}`;
  const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : "All dates";

  // ── 1. HEADER (White background with dark slate text) ──────────
  doc.setTextColor(11, 19, 42);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("ExpenseFlow", mL, 11);

  // Elegant Report Type Badge next to logo
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(mL + 30, 7.8, 32, 4.2, 1, 1, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(5.8);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION REPORT", mL + 32, 10.8);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${dateRange}    |    ${title}`, mL, 17);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageW - mL, 17, { align: "right" });

  // Clean header underline
  doc.setDrawColor(226, 232, 240);
  doc.line(mL, 20, pageW - mL, 20);

  // ── 2. SUMMARY STRIP CONTAINER (Dashboard Card Style) ──
  // Light card background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(mL, 22, tableW, 11, 1.2, 1.2, "F");
  // Light border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.15);
  doc.roundedRect(mL, 22, tableW, 11, 1.2, 1.2, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTIONS",  mL + 4,   25.5);
  doc.text("TOTAL CREDIT",  78,       25.5);
  doc.text("TOTAL DEBIT",   134,      25.5);
  doc.text("NET BALANCE",   pageW - mL - 4, 25.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(11, 19, 42);
  doc.text(String(dataToExport.length), mL + 4, 30);

  doc.setTextColor(4, 128, 80);
  doc.text(rs(totalCr), 78, 30);

  doc.setTextColor(195, 28, 28);
  doc.text(rs(totalDb), 134, 30);

  const netColor = netBal >= 0 ? [195, 28, 28] : [4, 128, 80];
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(
    netBal >= 0 ? `-Rs. ${Math.abs(netBal).toLocaleString("en-IN")}` : `Rs. ${Math.abs(netBal).toLocaleString("en-IN")}`,
    pageW - mL - 4, 30, { align: "right" }
  );

  // ── 3. TABLE ───────────────────────────────────────────────────
  const cols = [
    { label: "Customer",  x: mL,   w: 28 },
    { label: "Mobile",    x: 40,   w: 24 },
    { label: "Date",      x: 64,   w: 20 },
    { label: "Credit",    x: 84,   w: 20 },
    { label: "Debit",     x: 104,  w: 20 },
    { label: "Net Bal",   x: 124,  w: 22 },
    { label: "Category",  x: 146,  w: 22 },
    { label: "Note",      x: 168,  w: 30 },
  ];

  const rowH = 7;
  let y = 38; // standard grid start

  const drawHeader = () => {
    doc.setTextColor(11, 19, 42);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    cols.forEach(col => doc.text(col.label, col.x, y + 4.8));

    // Bottom divider line for header
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(mL, y + rowH, mL + tableW, y + rowH);

    y += rowH;
  };

  drawHeader();

  dataToExport.forEach((expense, idx) => {
    const noteLines: string[] = doc.splitTextToSize(expense.note || "-", cols[7].w - 2);
    const customerLines: string[] = doc.splitTextToSize(expense.customerName, cols[0].w - 2);
    const lineCount = Math.max(customerLines.length, noteLines.length, 1);
    const dynamicRowH = lineCount > 1 ? (lineCount * 3.5 + 2.5) : rowH;

    if (y + dynamicRowH > 275) {
      doc.addPage();
      y = 16;
      drawHeader();
    }

    const net     = parseFloat(expense.netBalance);
    const creditV = parseFloat(expense.credit);
    const debitV  = parseFloat(expense.debit);

    const rowData: (string | string[])[] = [
      customerLines,
      expense.customerPhone || "-",
      new Date(expense.date).toLocaleDateString("en-IN"),
      creditV > 0 ? creditV.toLocaleString("en-IN") : "-",
      debitV  > 0 ? debitV.toLocaleString("en-IN")  : "-",
      net > 0 ? `-${Math.abs(net).toLocaleString("en-IN")}` : Math.abs(net).toLocaleString("en-IN"),
      (expense.category || "Uncategorized").slice(0, 16),
      noteLines,
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);

    rowData.forEach((val, i) => {
      if      (i === 3 && creditV > 0) doc.setTextColor(4, 128, 80);
      else if (i === 4 && debitV  > 0) doc.setTextColor(195, 28, 28);
      else if (i === 5)                doc.setTextColor(net > 0 ? 195 : 4, net > 0 ? 28 : 128, net > 0 ? 28 : 80);
      else                             doc.setTextColor(30, 41, 59);
      doc.text(val, cols[i].x, y + 4.8);
    });

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.15);
    doc.line(mL, y + dynamicRowH, mL + tableW, y + dynamicRowH);

    y += dynamicRowH;
  });

  // ── 3.5 TOTAL ROW (At bottom of table) ────────────────────────
  if (y > 275) {
    doc.addPage();
    y = 16;
    drawHeader();
  }

  // Draw separator line above totals
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(mL, y, mL + tableW, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  // "Total"
  doc.setTextColor(11, 19, 42);
  doc.text("Total", cols[0].x, y + 4.8);

  // "-" for Mobile
  doc.setTextColor(148, 163, 184);
  doc.text("-", cols[1].x, y + 4.8);

  // "-" for Date
  doc.text("-", cols[2].x, y + 4.8);

  // Credit Total
  doc.setTextColor(4, 128, 80);
  doc.text(totalCr.toLocaleString("en-IN"), cols[3].x, y + 4.8);

  // Debit Total
  doc.setTextColor(195, 28, 28);
  doc.text(totalDb.toLocaleString("en-IN"), cols[4].x, y + 4.8);

  // Net Balance Total
  doc.setTextColor(netBal >= 0 ? 195 : 4, netBal >= 0 ? 28 : 128, netBal >= 0 ? 28 : 80);
  doc.text(
    netBal >= 0 ? `-${Math.abs(netBal).toLocaleString("en-IN")}` : Math.abs(netBal).toLocaleString("en-IN"),
    cols[5].x,
    y + 4.8
  );

  // "-" for Category
  doc.setTextColor(148, 163, 184);
  doc.text("-", cols[6].x, y + 4.8);

  // "-" for Note
  doc.text("-", cols[7].x, y + 4.8);

  // Bottom border line below totals
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(mL, y + rowH, mL + tableW, y + rowH);

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
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);
  const totalDebit = dataToExport.reduce((sum, cust) => {
    const bal = parseFloat(cust.netBalance);
    return bal > 0 ? sum + bal : sum;
  }, 0);
  const netBalance = totalDebit - totalCredit;

  const rs = (val: number) => `Rs. ${Math.abs(val).toLocaleString("en-IN")}`;

  // ── 1. HEADER (White background with dark slate text) ──────────
  doc.setTextColor(11, 19, 42);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("ExpenseFlow", mL, 11);

  // Elegant Report Type Badge next to logo
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(mL + 30, 7.8, 28, 4.2, 1, 1, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(5.8);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DIRECTORY", mL + 32, 10.8);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`Scope: All Customers    |    ${title}`, mL, 17);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageW - mL, 17, { align: "right" });

  // Clean header underline
  doc.setDrawColor(226, 232, 240);
  doc.line(mL, 20, pageW - mL, 20);

  // ── 2. SUMMARY STRIP CONTAINER (Dashboard Card Style) ──
  // Light card background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(mL, 22, tableW, 11, 1.2, 1.2, "F");
  // Light border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.15);
  doc.roundedRect(mL, 22, tableW, 11, 1.2, 1.2, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL CUSTOMERS",  mL + 4,   25.5);
  doc.text("TOTAL CREDIT",  78,       25.5);
  doc.text("TOTAL DEBIT",   134,      25.5);
  doc.text("NET BALANCE",   pageW - mL - 4, 25.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(11, 19, 42);
  doc.text(String(dataToExport.length), mL + 4, 30);

  doc.setTextColor(4, 128, 80);
  doc.text(rs(totalCredit), 78, 30);

  doc.setTextColor(195, 28, 28);
  doc.text(rs(totalDebit), 134, 30);

  const netColor = netBalance >= 0 ? [195, 28, 28] : [4, 128, 80];
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(
    netBalance >= 0 ? `-Rs. ${Math.abs(netBalance).toLocaleString("en-IN")}` : `Rs. ${Math.abs(netBalance).toLocaleString("en-IN")}`,
    pageW - mL - 4, 30, { align: "right" }
  );

  // ── 3. TABLE ───────────────────────────────────────────────────
  const cols = [
    { label: "Customer Name",   x: mL,      w: 70 },
    { label: "Mobile Number",   x: 82,      w: 70 },
    { label: "Net Balance",     x: 152,     w: 46 },
  ];

  const rowH = 7;
  let y = 38; // standard grid start

  const drawHeader = () => {
    doc.setTextColor(11, 19, 42);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    cols.forEach(col => doc.text(col.label, col.x, y + 4.8));

    // Bottom divider line for header
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(mL, y + rowH, mL + tableW, y + rowH);

    y += rowH;
  };

  drawHeader();

  dataToExport.forEach((cust, idx) => {
    if (y + rowH > 275) {
      doc.addPage();
      y = 16;
      drawHeader();
    }

    const bal = parseFloat(cust.netBalance);
    const isDb = bal > 0;

    const rowData = [
      cust.name.slice(0, 42),
      cust.phone || "-",
      isDb ? `-Rs. ${Math.abs(bal).toLocaleString("en-IN")}` : `Rs. ${Math.abs(bal).toLocaleString("en-IN")}`,
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);

    rowData.forEach((val, i) => {
      if (i === 2) {
        doc.setTextColor(isDb ? 195 : 4, isDb ? 28 : 128, isDb ? 28 : 80);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(String(val), cols[i].x, y + 4.8);
    });

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.15);
    doc.line(mL, y + rowH, mL + tableW, y + rowH);

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
