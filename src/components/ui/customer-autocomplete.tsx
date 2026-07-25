"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check } from "lucide-react";
import { getDistinctCustomers } from "@/services/expense-actions";
import { cn } from "@/lib/utils";

export interface CustomerOption {
  customerName: string;
  customerPhone: string;
  category?: string | null;
}

export interface CustomerAutocompleteProps {
  value: string;
  onChange: (customerName: string, selectedOption?: CustomerOption | null) => void;
  onSelectCustomer?: (customer: CustomerOption) => void;
  onAddNewCustomer?: (query: string) => void;
  customersList?: CustomerOption[];
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  autoFocus?: boolean;
}

export function CustomerAutocomplete({
  value,
  onChange,
  onSelectCustomer,
  onAddNewCustomer,
  customersList: externalCustomersList,
  disabled = false,
  required = false,
  id = "customerSearch",
  label = "Customer Name",
  placeholder = "Search customer by name or mobile...",
  error,
  className = "",
  autoFocus = false,
}: CustomerAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [internalCustomersList, setInternalCustomersList] = useState<CustomerOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveCustomersList = externalCustomersList || internalCustomersList;

  // Load distinct customers if external list not provided
  useEffect(() => {
    if (externalCustomersList) return;
    let isMounted = true;
    async function loadCustomers() {
      try {
        const data = await getDistinctCustomers();
        if (isMounted) {
          setInternalCustomersList(
            data.map((c) => ({
              customerName: c.customerName,
              customerPhone: c.customerPhone || "",
              category: c.category || "",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load customer suggestions:", err);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [externalCustomersList]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers =
    value.trim() === ""
      ? effectiveCustomersList
      : effectiveCustomersList.filter(
          (c) =>
            c.customerName.toLowerCase().includes(value.toLowerCase()) ||
            c.customerPhone.includes(value)
        );

  const handleSelect = (c: CustomerOption) => {
    onChange(c.customerName, c);
    if (onSelectCustomer) onSelectCustomer(c);
    setShowSuggestions(false);
  };

  const handleAddNew = () => {
    if (onAddNewCustomer) {
      onAddNewCustomer(value);
    }
    setShowSuggestions(false);
  };

  return (
    <div className={cn("space-y-1.5 relative", className)}>
      {label && (
        <Label htmlFor={id} className="text-slate-700 font-bold text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value, null);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-9 h-10 text-sm"
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
        />
      </div>

      {showSuggestions && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-1"
        >
          {filteredCustomers.length === 0 ? (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-slate-400">No matching customers found.</p>
              {value.trim() && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2 border border-dashed border-rose-200 rounded-lg transition-all cursor-pointer"
                >
                  + Use &quot;{value.trim()}&quot; as Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = value.trim().toLowerCase() === c.customerName.toLowerCase();
              return (
                <button
                  key={c.customerName}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#0b132a] text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{c.customerName}</span>
                    {c.customerPhone && <span className="text-[10px] opacity-80">{c.customerPhone}</span>}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
