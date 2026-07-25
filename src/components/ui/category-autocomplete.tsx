"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategories } from "@/services/expense-actions";
import { cn } from "@/lib/utils";

export interface CategoryAutocompleteProps {
  value: string;
  onChange: (category: string) => void;
  categoriesList?: string[];
  disabled?: boolean;
  id?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function CategoryAutocomplete({
  value,
  onChange,
  categoriesList: externalCategoriesList,
  disabled = false,
  id = "categorySearch",
  label = "Category",
  placeholder = "e.g. Petrol, Salary, Grocery",
  className = "",
}: CategoryAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [internalCategoriesList, setInternalCategoriesList] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveCategoriesList = externalCategoriesList || internalCategoriesList;

  // Load distinct categories if external list not provided
  useEffect(() => {
    if (externalCategoriesList) return;
    let isMounted = true;
    async function loadCats() {
      try {
        const data = await getCategories();
        if (isMounted) {
          setInternalCategoriesList(data);
        }
      } catch (err) {
        console.error("Failed to load category suggestions:", err);
      }
    }
    loadCats();
    return () => {
      isMounted = false;
    };
  }, [externalCategoriesList]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories =
    value.trim() === ""
      ? effectiveCategoriesList
      : effectiveCategoriesList.filter((cat) =>
          cat.toLowerCase().includes(value.toLowerCase())
        );

  const handleSelect = (cat: string) => {
    onChange(cat);
    setShowSuggestions(false);
  };

  return (
    <div className={cn("space-y-1.5 relative", className)}>
      {label && (
        <Label htmlFor={id} className="text-slate-700 font-bold text-xs">
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="h-10 text-sm"
        disabled={disabled}
      />

      {showSuggestions && !disabled && filteredCategories.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-[140px] overflow-y-auto p-1.5 space-y-1"
        >
          {filteredCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={cn(
                "flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                value.trim().toLowerCase() === cat.toLowerCase()
                  ? "bg-[#0b132a] text-white font-semibold"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
