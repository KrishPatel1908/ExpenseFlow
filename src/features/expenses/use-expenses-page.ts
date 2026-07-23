"use client";

import { useState, useEffect, useCallback } from "react";
import { getExpenses, getCategories, type ExpenseItem } from "@/services/expense-actions";
import { toast } from "sonner";

export type Expense = ExpenseItem;

export function useExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      const [res, categoriesData] = await Promise.all([
        getExpenses({
          page,
          pageSize,
          search: debouncedSearchQuery,
          typeFilter,
          categoryFilter: categoryFilter === "all" ? "" : categoryFilter,
          startDate,
          endDate,
          sortOrder,
        }),
        getCategories(),
      ]);

      setExpenses(res.expenses);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setDbCategories(categoriesData);
    } catch {
      setHasError(true);
      toast.error("Failed to load expenses. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearchQuery, typeFilter, categoryFilter, startDate, endDate, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFilterApplied =
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    searchQuery.trim() !== "" ||
    startDate !== "" ||
    endDate !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return {
    expenses,
    dbCategories,
    loading,
    hasError,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortOrder,
    setSortOrder,
    isFilterApplied,
    clearFilters,
    loadData,
  };
}
