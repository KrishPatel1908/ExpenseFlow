"use client";

import { useState } from "react";
import { useVoiceTrainingPage } from "../use-voice-training-page";
import { VoiceTrainingTable } from "./VoiceTrainingTable";
import { PageLayoutLock } from "@/components/page-layout-lock";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw, X, Sparkles, AlertCircle, UserCheck, Trash2 } from "lucide-react";
import { deleteVoiceTrainingRecord, deleteAllVoiceTrainingRecords } from "@/services/voice-training-actions";
import { toast } from "sonner";

export function VoiceTrainingClientView() {
  const {
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
    reload,
  } = useVoiceTrainingPage();

  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteSingleRecord = async (id: string) => {
    const res = await deleteVoiceTrainingRecord(id);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Voice training record deleted successfully.");
      await reload();
    }
  };

  const handleDeleteAllRecords = async () => {
    setIsDeletingAll(true);
    try {
      const res = await deleteAllVoiceTrainingRecords();
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        const countDeleted = res.deletedCount !== undefined ? res.deletedCount : totalCount;
        toast.success(`Successfully deleted ${countDeleted} voice training records.`);
        await reload();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete voice training records.";
      toast.error(msg);
    } finally {
      setIsDeletingAll(false);
      setDeleteAllConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6 pb-4 sm:pb-0">
      <PageLayoutLock />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Developer Voice Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Global Voice Training Hub
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Review voice parsing outputs across all users to optimize entity recognition algorithms. Restricted to <code className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono font-bold">admin@gmail.com</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {totalCount > 0 && (
            <Button
              type="button"
              onClick={() => setDeleteAllConfirmOpen(true)}
              variant="outline"
              className="gap-1.5 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All Records</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={reload}
            disabled={loading}
            variant="outline"
            className="gap-2 font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input (Transcript or User Email) */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search transcript or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10 border-slate-200 focus:border-rose-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* User Email Filter */}
          <div className="relative inline-flex items-center">
            <select
              value={userEmailFilter}
              onChange={(e) => {
                setUserEmailFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by User Email"
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 pl-8 pr-7 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 h-10 max-w-[200px] truncate"
            >
              <option value="all">All Users ({distinctUserEmails.length})</option>
              {distinctUserEmails.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
            <UserCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Confidence Filter */}
          <div className="relative inline-flex items-center">
            <select
              value={confidenceFilter}
              onChange={(e) => {
                setConfidenceFilter(e.target.value as "all" | "high" | "medium" | "low");
                setPage(1);
              }}
              aria-label="Filter by Confidence"
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 pl-8 pr-7 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 h-10"
            >
              <option value="all">All Confidence</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Corrected Filter */}
          <div className="relative inline-flex items-center">
            <select
              value={correctedFilter}
              onChange={(e) => {
                setCorrectedFilter(e.target.value as "all" | "corrected" | "uncorrected");
                setPage(1);
              }}
              aria-label="Filter by Correction Status"
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 pl-8 pr-7 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 h-10"
            >
              <option value="all">All Records</option>
              <option value="corrected">Edited Only</option>
              <option value="uncorrected">100% Matches</option>
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          {isFilterApplied && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-10 gap-1.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Failed to load voice training records from server.</span>
          </div>
          <Button
            type="button"
            onClick={reload}
            variant="outline"
            size="sm"
            className="text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Table Component */}
      <VoiceTrainingTable
        records={records}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onDeleteRecord={handleDeleteSingleRecord}
      />

      {/* Delete All Records Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteAllConfirmOpen}
        onOpenChange={setDeleteAllConfirmOpen}
        onConfirm={handleDeleteAllRecords}
        title="Delete All Voice Training Records"
        description={`Delete all ${totalCount} voice training records? This action cannot be undone.`}
        confirmText="Delete All"
        isSubmitting={isDeletingAll}
      />
    </div>
  );
}
