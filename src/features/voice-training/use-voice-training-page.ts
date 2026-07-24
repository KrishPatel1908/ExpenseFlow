"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getVoiceTrainingRecords,
  type VoiceTrainingItem,
} from "@/services/voice-training-actions";
import { toast } from "sonner";

export function useVoiceTrainingPage() {
  const [records, setRecords] = useState<VoiceTrainingItem[]>([]);
  const [distinctUserEmails, setDistinctUserEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [correctedFilter, setCorrectedFilter] = useState<"all" | "corrected" | "uncorrected">("all");

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
      const res = await getVoiceTrainingRecords({
        page,
        pageSize,
        search: debouncedSearchQuery,
        userEmailFilter,
        confidenceFilter,
        correctedFilter,
      });

      setRecords(res.records);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      if (res.distinctUserEmails) {
        setDistinctUserEmails(res.distinctUserEmails);
      }
    } catch (err: unknown) {
      setHasError(true);
      const msg = err instanceof Error ? err.message : "Failed to load voice training data.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearchQuery, userEmailFilter, confidenceFilter, correctedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const isFilterApplied =
    searchQuery.trim() !== "" ||
    userEmailFilter !== "all" ||
    confidenceFilter !== "all" ||
    correctedFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setUserEmailFilter("all");
    setConfidenceFilter("all");
    setCorrectedFilter("all");
    setPage(1);
  };

  return {
    records,
    distinctUserEmails,
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
    userEmailFilter,
    setUserEmailFilter,
    confidenceFilter,
    setConfidenceFilter,
    correctedFilter,
    setCorrectedFilter,
    isFilterApplied,
    clearFilters,
    reload: loadData,
  };
}
