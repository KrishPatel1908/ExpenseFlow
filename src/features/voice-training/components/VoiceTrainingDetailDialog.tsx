"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { VoiceTrainingItem } from "@/services/voice-training-actions";
import { Mic, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

export interface VoiceTrainingDetailDialogProps {
  record: VoiceTrainingItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceTrainingDetailDialog({
  record,
  isOpen,
  onOpenChange,
}: VoiceTrainingDetailDialogProps) {
  if (!record) return null;

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

  const isFieldChanged = (parsed: string | null, finalVal: string | null) => {
    return (parsed || "").trim().toLowerCase() !== (finalVal || "").trim().toLowerCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
              <Mic className="h-4 w-4" />
              <span>Voice Parser Training Comparison</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getConfidenceBadge(
                record.confidence
              )}`}
            >
              {record.confidence} Confidence
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-slate-900">
            Training Record Details
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Comparing rule-based parser output against user-confirmed final values.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Original Spoken Transcript Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 shadow">
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">
              Original Spoken Transcript
            </span>
            <p className="text-sm font-medium italic text-slate-100">&quot;{record.transcript}&quot;</p>
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Recorded at: {new Date(record.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Correction Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              record.isCorrected
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            {record.isCorrected ? (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>User edited values during review. Highlighted fields show corrections.</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Parser values were 100% accurate and confirmed without changes!</span>
              </>
            )}
          </div>

          {/* Side-by-side Field Comparison Grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-11 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              <span className="col-span-3">Field</span>
              <span className="col-span-4">Rule-Based Parser Output</span>
              <span className="col-span-4">Final Confirmed Value</span>
            </div>

            {/* Customer */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedCustomer, record.finalCustomer)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Customer Name</span>
              <span className="col-span-4 font-mono text-slate-600">
                {record.parsedCustomer || <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                {record.finalCustomer || <span className="text-slate-400 italic">null</span>}
              </span>
            </div>

            {/* Amount */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedAmount, record.finalAmount)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Amount</span>
              <span className="col-span-4 font-mono text-slate-600">
                {record.parsedAmount ? `₹${record.parsedAmount}` : <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold text-emerald-700 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                {record.finalAmount ? `₹${record.finalAmount}` : <span className="text-slate-400 italic">null</span>}
              </span>
            </div>

            {/* Transaction Type */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedTransactionType, record.finalTransactionType)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Transaction Type</span>
              <span className="col-span-4 font-mono text-slate-600 uppercase">
                {record.parsedTransactionType || <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold uppercase flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className={record.finalTransactionType === "credit" ? "text-emerald-600" : "text-rose-600"}>
                  {record.finalTransactionType || "debit"}
                </span>
              </span>
            </div>

            {/* Category */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedCategory, record.finalCategory)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Category</span>
              <span className="col-span-4 font-mono text-slate-600">
                {record.parsedCategory || <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                {record.finalCategory || <span className="text-slate-400 italic">null</span>}
              </span>
            </div>

            {/* Date */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedDate, record.finalDate)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Date</span>
              <span className="col-span-4 font-mono text-slate-600">
                {record.parsedDate || <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                {record.finalDate || <span className="text-slate-400 italic">null</span>}
              </span>
            </div>

            {/* Description */}
            <div
              className={`grid grid-cols-11 items-center p-3 rounded-xl border text-xs ${
                isFieldChanged(record.parsedDescription, record.finalDescription)
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-100"
              }`}
            >
              <span className="col-span-3 font-bold text-slate-700">Description</span>
              <span className="col-span-4 font-mono text-slate-600 truncate">
                {record.parsedDescription || <span className="text-slate-400 italic">null</span>}
              </span>
              <span className="col-span-4 font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                {record.finalDescription || <span className="text-slate-400 italic">null</span>}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-[#0b132a] hover:bg-[#1a284e] text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
