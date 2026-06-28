"use client";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense, updateExpense, getDistinctCustomers, getCategories } from "@/services/expense-actions";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
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

  // Autocomplete / Search states (Instant for input, debounced for filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  
  // Custom Category Suggestion States
  const [showExpenseCatSuggestions, setShowExpenseCatSuggestions] = useState(false);
  const [showCustCatSuggestions, setShowCustCatSuggestions] = useState(false);

  // Refs for click outside handling
  const suggestionRef = useRef<HTMLDivElement>(null);
  const expenseCatRef = useRef<HTMLDivElement>(null);
  const custCatRef = useRef<HTMLDivElement>(null);

  // Add Expense Form Fields
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseCredit, setExpenseCredit] = useState("");
  const [expenseDebit, setExpenseDebit] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Add Customer Form Fields
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custCategory, setCustCategory] = useState("");
  const [custCredit, setCustCredit] = useState("");
  const [custDebit, setCustDebit] = useState("");
  const [custDate, setCustDate] = useState("");
  const [custNote, setCustNote] = useState("");

  // Format date to YYYY-MM-DD for HTML input
  const formatDateForInput = (dateVal: Date | string | undefined) => {
    if (!dateVal) return "";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  // Debounce search input for autocomplete suggestions (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load distinct customers and categories for autocomplete
  useEffect(() => {
    async function loadFormData() {
      try {
        const [customersData, categoriesData] = await Promise.all([
          getDistinctCustomers(),
          getCategories()
        ]);
        
        const formatted = customersData.map(c => ({
          customerName: c.customerName,
          customerPhone: c.customerPhone || "",
          category: c.category || ""
        }));
        setCustomersList(formatted);
        setCategoriesList(categoriesData);
      } catch {
        toast.error("Failed to load autocomplete options.");
      }
    }
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Click outside listener for all custom suggestion dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (expenseCatRef.current && !expenseCatRef.current.contains(event.target as Node)) {
        setShowExpenseCatSuggestions(false);
      }
      if (custCatRef.current && !custCatRef.current.contains(event.target as Node)) {
        setShowCustCatSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync initialData when opening (Edit Mode)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab("expense");
        setSearchQuery(initialData.customerName || "");
        setSelectedCustomer({
          customerName: initialData.customerName,
          customerPhone: initialData.customerPhone || "",
          category: initialData.category || ""
        });
        setExpenseCategory(initialData.category || "");
        setExpenseCredit(parseFloat(initialData.credit) > 0 ? initialData.credit : "0");
        setExpenseDebit(parseFloat(initialData.debit) > 0 ? initialData.debit : "0");
        setExpenseDate(formatDateForInput(initialData.date));
        setExpenseNote(initialData.note || "");
      } else {
        setActiveTab("expense");
        setSearchQuery("");
        setSelectedCustomer(null);
        setExpenseCategory("");
        setExpenseCredit("");
        setExpenseDebit("");
        setExpenseDate(formatDateForInput(new Date()));
        setExpenseNote("");

        // Reset Add Customer fields
        setCustName("");
        setCustPhone("");
        setCustCategory("");
        setCustCredit("");
        setCustDebit("");
        setCustDate(formatDateForInput(new Date()));
        setCustNote("");
      }
    }
  }, [isOpen, initialData]);

  const filteredCustomers = debouncedSearchQuery.trim() === ""
    ? customersList
    : customersList.filter(c =>
      c.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.customerPhone.includes(debouncedSearchQuery)
    );

  const filteredExpenseCategories = expenseCategory.trim() === ""
    ? categoriesList
    : categoriesList.filter(cat => cat.toLowerCase().includes(expenseCategory.toLowerCase()));

  const filteredCustCategories = custCategory.trim() === ""
    ? categoriesList
    : categoriesList.filter(cat => cat.toLowerCase().includes(custCategory.toLowerCase()));

  const handleSelectCustomer = (c: CustomerOption) => {
    setSelectedCustomer(c);
    setSearchQuery(c.customerName);
    setExpenseCategory(c.category || "");
    setShowSuggestions(false);
  };

  // Switch to Add Customer tab and prefill details
  const handleCreateNewCustomerFromSearch = (query: string) => {
    const cleanQuery = query.trim();
    setCustName("");
    setCustPhone("");

    // If query contains only digits, treat it as a phone number. Otherwise, treat it as a customer name.
    if (/^\d+$/.test(cleanQuery)) {
      setCustPhone(cleanQuery.slice(0, 10));
    } else {
      setCustName(cleanQuery);
    }

    setActiveTab("customer");
    setShowSuggestions(false);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === "expense" || initialData) {
        // --- ADD / EDIT EXPENSE FORM ---
        if (!selectedCustomer) {
          toast.error("Please select a customer.");
          setIsSubmitting(false);
          return;
        }

        if (!selectedCustomer.customerPhone || selectedCustomer.customerPhone.trim().length < 10) {
          toast.error("A valid 10-digit mobile number is required for the customer.");
          setIsSubmitting(false);
          return;
        }

        const creditVal = parseFloat(expenseCredit) || 0;
        const debitVal = parseFloat(expenseDebit) || 0;
        const finalDate = expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString();

        const payload = {
          customerName: selectedCustomer.customerName,
          customerPhone: selectedCustomer.customerPhone,
          category: expenseCategory || undefined,
          credit: creditVal,
          debit: debitVal,
          date: finalDate,
          note: expenseNote || undefined,
        };

        const res = initialData
          ? await updateExpense(initialData.id, payload)
          : await createExpense(payload);

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(initialData ? "Transaction updated successfully!" : "Transaction recorded successfully!");
          onSuccess();
          onOpenChange(false);
        }
      } else {
        // --- ADD CUSTOMER FORM ---
        if (!custName || custName.trim().length < 2) {
          toast.error("Customer name is required.");
          setIsSubmitting(false);
          return;
        }
        if (!custPhone || custPhone.trim().length !== 10) {
          toast.error("Mobile number must be exactly 10 digits.");
          setIsSubmitting(false);
          return;
        }

        const creditVal = parseFloat(custCredit) || 0;
        const debitVal = parseFloat(custDebit) || 0;
        const finalDate = custDate ? new Date(custDate).toISOString() : new Date().toISOString();

        const payload = {
          customerName: custName,
          customerPhone: custPhone,
          category: custCategory || undefined,
          credit: creditVal,
          debit: debitVal,
          date: finalDate,
          note: custNote || undefined,
        };

        const res = await createExpense(payload);

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Customer and initial balance recorded!");
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">

        {/* Tab Headers */}
        {!initialData && (
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("expense")}
              className={cn(
                "flex-1 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                activeTab === "expense"
                  ? "border-[#0b132a] text-[#0b132a] bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={cn(
                "flex-1 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                activeTab === "customer"
                  ? "border-[#0b132a] text-[#0b132a] bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Add Customer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>
                {initialData
                  ? "Edit Transaction"
                  : activeTab === "expense"
                    ? "Add Expense"
                    : "Add New Customer"
                }
              </DialogTitle>
              <DialogDescription>
                {initialData
                  ? "Update this transaction's details."
                  : activeTab === "expense"
                    ? "Record a new transaction for an existing customer."
                    : "Create a new customer profile and record their initial balance."
                }
              </DialogDescription>
            </DialogHeader>

            {activeTab === "expense" || initialData ? (
              /* --- ADD/EDIT EXPENSE FORM VIEW --- */
              <div className="space-y-4">
                {/* Search / Select Customer */}
                <div className="space-y-1.5 relative">
                  <Label htmlFor="customerSearch" className="text-slate-700 font-bold">Search Customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="customerSearch"
                      type="text"
                      placeholder="Search by name or mobile..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="pl-9 h-10 text-sm"
                      disabled={!!initialData}
                      required
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && !initialData && (
                    <div
                      ref={suggestionRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-1"
                    >
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-center space-y-2">
                          <p className="text-xs text-slate-400">No matching customers found.</p>
                          <button
                            type="button"
                            onClick={() => handleCreateNewCustomerFromSearch(searchQuery)}
                            className="w-full text-xs font-bold text-blue-650 hover:text-blue-800 hover:bg-blue-50/50 py-2.5 border border-dashed border-blue-200 rounded-xl transition-all cursor-pointer"
                          >
                            + Add &quot;{searchQuery}&quot; as New Customer
                          </button>
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const isSelected = selectedCustomer?.customerName === c.customerName;
                          return (
                            <button
                              key={c.customerName}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className={cn(
                                "flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-xs transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-[#0b132a] text-white font-semibold"
                                  : "text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{c.customerName}</span>
                                <span className="text-[10px] opacity-80">{c.customerPhone}</span>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Credit & Debit in a Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expenseCredit" className="text-red-600 font-bold">Credit</Label>
                    <Input
                      id="expenseCredit"
                      type="number"
                      step="0.01"
                      placeholder="₹ 0.00"
                      value={expenseCredit}
                      onChange={(e) => setExpenseCredit(e.target.value)}
                      className="focus-visible:ring-red-500 focus:border-red-500 border-red-200 text-red-700 placeholder:text-red-300 h-10 text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expenseDebit" className="text-emerald-600 font-bold">Debit</Label>
                    <Input
                      id="expenseDebit"
                      type="number"
                      step="0.01"
                      placeholder="₹ 0.00"
                      value={expenseDebit}
                      onChange={(e) => setExpenseDebit(e.target.value)}
                      className="focus-visible:ring-emerald-500 focus:border-emerald-500 border-emerald-200 text-emerald-700 placeholder:text-emerald-300 h-10 text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Category with Custom Autocomplete Dropdown */}
                <div className="space-y-1.5 relative">
                  <Label htmlFor="expenseCategory" className="text-slate-700 font-bold">Category (Optional)</Label>
                  <Input
                    id="expenseCategory"
                    type="text"
                    placeholder="Enter or search category..."
                    value={expenseCategory}
                    onChange={(e) => {
                      setExpenseCategory(e.target.value);
                      setShowExpenseCatSuggestions(true);
                    }}
                    onFocus={() => setShowExpenseCatSuggestions(true)}
                    className="h-10 text-sm"
                  />
                  {showExpenseCatSuggestions && filteredExpenseCategories.length > 0 && (
                    <div
                      ref={expenseCatRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto p-1.5 space-y-1"
                    >
                      {filteredExpenseCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setExpenseCategory(cat);
                            setShowExpenseCatSuggestions(false);
                          }}
                          className="flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expenseDate" className="text-slate-700 font-bold">Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="expenseNote" className="text-slate-700 font-bold">Note (Optional)</Label>
                  <Input
                    id="expenseNote"
                    type="text"
                    placeholder="Enter short note..."
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            ) : (
              /* --- ADD CUSTOMER FORM VIEW --- */
              <div className="space-y-4">
                {/* Cust Name & Mobile */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="custName" className="text-slate-700 font-bold">Customer Name</Label>
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
                    <Label htmlFor="custPhone" className="text-slate-700 font-bold">Mobile Number</Label>
                    <Input
                      id="custPhone"
                      type="tel"
                      placeholder="10-digit mobile..."
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Category with Custom Autocomplete Dropdown */}
                <div className="space-y-1.5 relative">
                  <Label htmlFor="custCategory" className="text-slate-700 font-bold">Category (Optional)</Label>
                  <Input
                    id="custCategory"
                    type="text"
                    placeholder="Enter or search category..."
                    value={custCategory}
                    onChange={(e) => {
                      setCustCategory(e.target.value);
                      setShowCustCatSuggestions(true);
                    }}
                    onFocus={() => setShowCustCatSuggestions(true)}
                    className="h-10 text-sm"
                  />
                  {showCustCatSuggestions && filteredCustCategories.length > 0 && (
                    <div
                      ref={custCatRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto p-1.5 space-y-1"
                    >
                      {filteredCustCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCustCategory(cat);
                            setShowCustCatSuggestions(false);
                          }}
                          className="flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Credit & Debit in a Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="custCredit" className="text-red-600 font-bold">Credit</Label>
                    <Input
                      id="custCredit"
                      type="number"
                      step="0.01"
                      placeholder="₹ 0.00"
                      value={custCredit}
                      onChange={(e) => setCustCredit(e.target.value)}
                      className="focus-visible:ring-red-500 focus:border-red-500 border-red-200 text-red-700 placeholder:text-red-300 h-10 text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custDebit" className="text-emerald-600 font-bold">Debit</Label>
                    <Input
                      id="custDebit"
                      type="number"
                      step="0.01"
                      placeholder="₹ 0.00"
                      value={custDebit}
                      onChange={(e) => setCustDebit(e.target.value)}
                      className="focus-visible:ring-emerald-500 focus:border-emerald-500 border-emerald-200 text-emerald-700 placeholder:text-emerald-300 h-10 text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="custDate" className="text-slate-700 font-bold">Date</Label>
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
                  <Label htmlFor="custNote" className="text-slate-700 font-bold">Note (Optional)</Label>
                  <Input
                    id="custNote"
                    type="text"
                    placeholder="Enter short note..."
                    value={custNote}
                    onChange={(e) => setCustNote(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : activeTab === "expense"
                    ? "Add Expense"
                    : "Create Customer"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
