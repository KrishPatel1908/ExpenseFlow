"use client";

import { useState, useEffect, useCallback } from "react";
import { getExpenses, getCategories } from "@/services/expense-actions";
import { type Expense } from "@/features/expenses/expense-table";
import { toast } from "sonner";

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());

  // Auto-fill endDate when startDate set but endDate empty
  useEffect(() => {
    if (startDate && !endDate) setEndDate(getTodayDateString());
  }, [startDate, endDate]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([getExpenses(), getCategories()]);
      setExpenses(expensesData.map(e => ({ ...e, date: new Date(e.date) })));
      setDbCategories(categoriesData);
    } catch {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredExpenses = expenses.filter(expense => {
    const q = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      expense.customerName.toLowerCase().includes(q) ||
      (expense.customerPhone && expense.customerPhone.includes(q)) ||
      (expense.category && expense.category.toLowerCase().includes(q)) ||
      (expense.note && expense.note.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "credit" && parseFloat(expense.credit) > 0) ||
      (typeFilter === "debit" && parseFloat(expense.debit) > 0);

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && expense.date >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && expense.date <= end;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const isFilterApplied =
    typeFilter !== "all" || categoryFilter !== "all" || searchQuery !== "" || startDate !== "" || endDate !== "";

  return {
    expenses, dbCategories, loading,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    filteredExpenses, isFilterApplied,
    loadData,
  };
}
