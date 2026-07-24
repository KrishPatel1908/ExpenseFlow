"use client";

import { useState, useEffect, useCallback } from "react";
import { getCustomers, type CustomerWithStats } from "@/services/customer-actions";
import { toast } from "sonner";

export function useCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
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
      const res = await getCustomers({ search: debouncedSearchQuery });
      setCustomers(res.customers);
    } catch {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const filteredCustomers = customers.filter(c => {
    const q = debouncedSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nickname && c.nickname.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const isFilterApplied = searchQuery !== "";

  return {
    customers, loading,
    searchQuery, setSearchQuery,
    filteredCustomers, isFilterApplied,
    loadCustomers,
  };
}
