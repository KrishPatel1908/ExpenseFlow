"use client";

import { useState } from "react";
import type { VoiceTrainingItem } from "@/services/voice-training-actions";
import { VoiceTrainingDetailDialog } from "./VoiceTrainingDetailDialog";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight, Inbox, CheckCircle2, AlertTriangle, User } from "lucide-react";

export interface VoiceTrainingTableProps {
  records: VoiceTrainingItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function VoiceTrainingTable({
  records,
  loading,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: VoiceTrainingTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<VoiceTrainingItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleOpenDetail = (rec: VoiceTrainingItem) => {
    setSelectedRecord(rec);
    setDetailDialogOpen(true);
  };

  const getConfidenceBadge = (conf: string) => {
    switch (conf.toLowerCase()) {
      case "high":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "low":
      default:
        return "bg-rose-100 text-rose-800 border-rose-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Original Transcript</th>
                <th className="py-3.5 px-4">User Email</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Parser Summary</th>
                <th className="py-3.5 px-4">Final Confirmed</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-20 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-8 w-20 bg-slate-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">No voice training records found</p>
                        <p className="text-xs text-slate-500">
                          Voice input transactions across all users will automatically generate training data here.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Transcript */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2 italic" title={rec.transcript}>
                        &quot;{rec.transcript}&quot;
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* User Email */}
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate" title={rec.userEmail || "Anonymous User"}>
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{rec.userEmail || "No Email"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate block pl-5" title={rec.userId}>
                        {rec.userId.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getConfidenceBadge(
                          rec.confidence
                        )}`}
                      >
                        {rec.confidence}
                      </span>
                    </td>

                    {/* Parser Summary */}
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {rec.parsedCustomer || <span className="text-slate-400 italic">No Name</span>}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rec.parsedAmount ? `₹${rec.parsedAmount}` : "No Amount"}{" "}
                          {rec.parsedTransactionType ? `(${rec.parsedTransactionType})` : ""}
                        </div>
                      </div>
                    </td>

                    {/* Final Confirmed */}
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-slate-900 truncate">{rec.finalCustomer}</div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          ₹{rec.finalAmount} ({rec.finalTransactionType})
                        </div>
                      </div>
                    </td>

                    {/* Correction Status */}
                    <td className="py-3.5 px-4 text-center">
                      {rec.isCorrected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Edited</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>100% Match</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(rec)}
                        className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Compare</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Showing <strong className="text-slate-800">{records.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{" "}
                <strong className="text-slate-800">{Math.min(page * pageSize, totalCount)}</strong> of{" "}
                <strong className="text-slate-800">{totalCount}</strong> entries
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="h-8 text-xs cursor-pointer gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>
              <span className="px-3 font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-8 text-xs cursor-pointer gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Detail Dialog */}
      <VoiceTrainingDetailDialog
        record={selectedRecord}
        isOpen={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
