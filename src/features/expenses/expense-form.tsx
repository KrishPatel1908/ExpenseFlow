"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense, updateExpense, getDistinctCustomers, getCategories } from "@/services/expense-actions";
import { Loader2, CheckCircle2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerAutocomplete } from "@/components/ui/customer-autocomplete";
import { CategoryAutocomplete } from "@/components/ui/category-autocomplete";

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id?: string;
    customerName: string;
    customerPhone?: string | null;
    category?: string | null;
    credit: string;
    debit: string;
    date: Date | string;
    note?: string | null;
  } | null;
  onSuccess: () => void;
}

type FormTab = "expense" | "customer";

interface CustomerOption {
  customerName: string;
  customerPhone: string;
  category?: string | null;
}

export function ExpenseForm({ isOpen, onOpenChange, initialData, onSuccess }: ExpenseFormProps) {
  const [activeTab, setActiveTab] = useState<FormTab>("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete data states
  const [searchQuery, setSearchQuery] = useState("");
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  // Add Expense Form Fields
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("debit");
  const [amount, setAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Add Customer Form Fields
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custTransactionType, setCustTransactionType] = useState<"credit" | "debit">("debit");
  const [custAmount, setCustAmount] = useState("");
  const [custCategory, setCustCategory] = useState("");
  const [custDate, setCustDate] = useState("");
  const [custNote, setCustNote] = useState("");

  // Format date helper YYYY-MM-DD
  const formatDateForInput = (dateVal: Date | string | undefined) => {
    if (!dateVal) return "";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    async function loadFormData() {
      try {
        const [customersData, categoriesData] = await Promise.all([
          getDistinctCustomers(),
          getCategories(),
        ]);

        const formatted = customersData.map((c) => ({
          customerName: c.customerName,
          customerPhone: c.customerPhone || "",
          category: c.category || "",
        }));
        setCustomersList(formatted);
        setCategoriesList(categoriesData);
      } catch {
        toast.error("Could not load customer suggestions.");
      }
    }
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (initialData) {
        setActiveTab("expense");
        setSearchQuery(initialData.customerName || "");
        setSelectedCustomer({
          customerName: initialData.customerName,
          customerPhone: initialData.customerPhone || "",
          category: initialData.category || "",
        });
        const creditVal = parseFloat(initialData.credit) || 0;
        const debitVal = parseFloat(initialData.debit) || 0;

        if (creditVal > 0) {
          setTransactionType("credit");
          setAmount(String(creditVal));
        } else {
          setTransactionType("debit");
          setAmount(String(debitVal));
        }

        setExpenseCategory(initialData.category || "");
        setExpenseDate(formatDateForInput(initialData.date));
        setExpenseNote(initialData.note || "");
      } else {
        setActiveTab("expense");
        setSearchQuery("");
        setSelectedCustomer(null);
        setTransactionType("debit");
        setAmount("");
        setExpenseCategory("");
        setExpenseDate(formatDateForInput(new Date()));
        setExpenseNote("");

        setCustName("");
        setCustPhone("");
        setCustTransactionType("debit");
        setCustAmount("");
        setCustCategory("");
        setCustDate(formatDateForInput(new Date()));
        setCustNote("");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, initialData]);

  const handleCreateNewCustomerFromSearch = (query: string) => {
    const cleanQuery = query.trim();
    setCustName("");
    setCustPhone("");

    if (/^\d+$/.test(cleanQuery)) {
      setCustPhone(cleanQuery.slice(0, 10));
    } else {
      setCustName(cleanQuery);
    }

    setActiveTab("customer");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === "expense" || initialData) {
        if (!selectedCustomer) {
          toast.error("Please select an existing customer or create a new one.");
          setIsSubmitting(false);
          return;
        }

        if (selectedCustomer.customerPhone && selectedCustomer.customerPhone.trim() && selectedCustomer.customerPhone.trim().length !== 10) {
          toast.error("Mobile number must be 10 digits if provided.");
          setIsSubmitting(false);
          return;
        }

        const numAmount = parseFloat(amount) || 0;
        if (numAmount <= 0) {
          toast.error("Transaction amount must be greater than zero.");
          setIsSubmitting(false);
          return;
        }

        const finalDate = expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString();

        const payload = {
          customerName: selectedCustomer.customerName,
          customerPhone: selectedCustomer.customerPhone,
          category: expenseCategory || undefined,
          credit: transactionType === "credit" ? numAmount : 0,
          debit: transactionType === "debit" ? numAmount : 0,
          date: finalDate,
          note: expenseNote || undefined,
        };

        const res = initialData?.id
          ? await updateExpense(initialData.id, payload)
          : await createExpense(payload);

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(initialData?.id ? "Transaction updated successfully!" : "Transaction recorded successfully!");
          onSuccess();
          onOpenChange(false);
        }
      } else {
        if (!custName || custName.trim().length < 2) {
          toast.error("Please enter a customer name (at least 2 characters).");
          setIsSubmitting(false);
          return;
        }

        if (custPhone && custPhone.trim() && custPhone.trim().length !== 10) {
          toast.error("Mobile number must be 10 digits if provided.");
          setIsSubmitting(false);
          return;
        }

        const numAmount = parseFloat(custAmount) || 0;
        if (numAmount <= 0) {
          toast.error("Transaction amount must be greater than zero.");
          setIsSubmitting(false);
          return;
        }

        const finalDate = custDate ? new Date(custDate).toISOString() : new Date().toISOString();

        const payload = {
          customerName: custName,
          customerPhone: custPhone,
          category: custCategory || undefined,
          credit: custTransactionType === "credit" ? numAmount : 0,
          debit: custTransactionType === "debit" ? numAmount : 0,
          date: finalDate,
          note: custNote || undefined,
        };

        const res = await createExpense(payload);

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Customer and initial transaction recorded!");
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch {
      toast.error("Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Header matching VoiceTransactionDialog */}
        <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {initialData?.id
              ? "Edit Transaction"
              : activeTab === "expense"
              ? "Add Expense"
              : "Add New Customer"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {initialData
              ? "Update this transaction's details below."
              : activeTab === "expense"
              ? "Record a new transaction for a customer."
              : "Create a new customer profile and record initial balance."}
          </DialogDescription>

          {!initialData && (
            <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 mt-3 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("expense")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === "expense"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === "customer"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                New Customer
              </button>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-4">
          {activeTab === "expense" || initialData ? (
            /* --- EXISTING CUSTOMER EXPENSE FORM VIEW --- */
            <div className="space-y-4">
              {/* Customer Search Autocomplete */}
              <CustomerAutocomplete
                id="customerSearch"
                label="Customer Name"
                value={searchQuery}
                onChange={(val, option) => {
                  setSearchQuery(val);
                  if (option) {
                    setSelectedCustomer(option);
                    setExpenseCategory(option.category || "");
                  } else {
                    setSelectedCustomer(val.trim() ? { customerName: val, customerPhone: selectedCustomer?.customerPhone || "" } : null);
                  }
                }}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setSearchQuery(c.customerName);
                  setExpenseCategory(c.category || "");
                }}
                onAddNewCustomer={(query) => handleCreateNewCustomerFromSearch(query)}
                customersList={customersList}
                disabled={!!initialData?.id}
                required
              />

              {/* Mobile Number (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="expense-customer-phone" className="text-slate-700 font-bold text-xs">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="expense-customer-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={selectedCustomer?.customerPhone || ""}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setSelectedCustomer((prev) =>
                        prev
                          ? { ...prev, customerPhone: clean }
                          : { customerName: searchQuery, customerPhone: clean }
                      );
                    }}
                    className="pl-9 h-10 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Amount & Transaction Type in a Row (Matching VoiceTransactionDialog) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Amount Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="expenseAmount" className="text-slate-700 font-bold text-xs">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 text-sm font-semibold"
                    required
                  />
                </div>

                {/* Transaction Type Buttons */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-bold text-xs">Transaction Type</Label>
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200" role="radiogroup" aria-label="Transaction Type">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={transactionType === "credit"}
                      onClick={() => setTransactionType("credit")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                        transactionType === "credit"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Credit
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={transactionType === "debit"}
                      onClick={() => setTransactionType("debit")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                        transactionType === "debit"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Debit
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Autocomplete */}
              <CategoryAutocomplete
                id="expenseCategory"
                label="Category"
                value={expenseCategory}
                onChange={(val) => setExpenseCategory(val)}
                categoriesList={categoriesList}
              />

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="expenseDate" className="text-slate-700 font-bold text-xs">
                  Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Description / Note */}
              <div className="space-y-1.5">
                <Label htmlFor="expenseNote" className="text-slate-700 font-bold text-xs">
                  Description / Note
                </Label>
                <Input
                  id="expenseNote"
                  type="text"
                  placeholder="Short transaction description"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          ) : (
            /* --- NEW CUSTOMER FORM VIEW --- */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="custName" className="text-slate-700 font-bold text-xs">
                    Customer Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="custName"
                    type="text"
                    placeholder="Enter name..."
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custPhone" className="text-slate-700 font-bold text-xs">
                    Mobile Number
                  </Label>
                  <Input
                    id="custPhone"
                    type="tel"
                    placeholder="10-digit mobile..."
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Amount & Transaction Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="custAmount" className="text-slate-700 font-bold text-xs">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="custAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={custAmount}
                    onChange={(e) => setCustAmount(e.target.value)}
                    className="h-10 text-sm font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-bold text-xs">Transaction Type</Label>
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200" role="radiogroup">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={custTransactionType === "credit"}
                      onClick={() => setCustTransactionType("credit")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                        custTransactionType === "credit"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Credit
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={custTransactionType === "debit"}
                      onClick={() => setCustTransactionType("debit")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                        custTransactionType === "debit"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Debit
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Autocomplete */}
              <CategoryAutocomplete
                id="custCategory"
                label="Category"
                value={custCategory}
                onChange={(val) => setCustCategory(val)}
                categoriesList={categoriesList}
              />

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="custDate" className="text-slate-700 font-bold text-xs">
                  Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="custDate"
                  type="date"
                  value={custDate}
                  onChange={(e) => setCustDate(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="custNote" className="text-slate-700 font-bold text-xs">
                  Description / Note
                </Label>
                <Input
                  id="custNote"
                  type="text"
                  placeholder="Short transaction description"
                  value={custNote}
                  onChange={(e) => setCustNote(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold gap-1.5 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {initialData
                      ? "Save Changes"
                      : activeTab === "expense"
                      ? "Add Expense"
                      : "Create Customer"}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
