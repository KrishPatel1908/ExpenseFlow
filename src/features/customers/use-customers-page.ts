"use client";

import { useState, useEffect, useCallback } from "react";
import { getCustomersWithBalances } from "@/services/expense-actions";
import { type Customer } from "@/features/customers/customer-table";
import { toast } from "sonner";

export function useCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await getCustomersWithBalances());
    } catch {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filteredCustomers = customers.filter(c => {
    const q = debouncedSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const isFilterApplied = searchQuery !== "";

  return {
    customers, loading,
    searchQuery, setSearchQuery,
    filteredCustomers, isFilterApplied,
    loadCustomers,
  };
}
