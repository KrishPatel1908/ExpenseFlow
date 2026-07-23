"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, CheckCircle2, AlertCircle } from "lucide-react";

export const voiceConfirmationSchema = z.object({
  customer: z.string().min(1, "Customer name is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  transactionType: z.enum(["credit", "debit"]),
  category: z.string(),
  description: z.string(),
  date: z.string().min(1, "Date is required"),
});

export type VoiceConfirmationFormValues = z.infer<typeof voiceConfirmationSchema>;

export interface VoiceTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transcript?: string;
  initialData?: {
    customer?: string;
    amount?: number;
    transactionType?: "credit" | "debit";
    category?: string;
    description?: string;
    date?: string;
  } | null;
  onConfirm: (data: VoiceConfirmationFormValues) => void;
  onCancel?: () => void;
}

export function VoiceTransactionDialog({
  isOpen,
  onOpenChange,
  transcript = "",
  initialData,
  onConfirm,
  onCancel,
}: VoiceTransactionDialogProps) {
  // Format date helper (YYYY-MM-DD)
  const getDefaultDate = (dateVal?: string) => {
    if (!dateVal) return new Date().toISOString().split("T")[0];
    if (dateVal === "today") return new Date().toISOString().split("T")[0];
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime())
      ? new Date().toISOString().split("T")[0]
      : parsed.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VoiceConfirmationFormValues>({
    resolver: zodResolver(voiceConfirmationSchema),
    defaultValues: {
      customer: initialData?.customer || "",
      amount: Number(initialData?.amount) || 0,
      transactionType: initialData?.transactionType || "debit",
      category: initialData?.category || "",
      description: initialData?.description || "",
      date: getDefaultDate(initialData?.date),
    },
  });

  // Re-sync form default values when initialData changes or dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        customer: initialData.customer || "",
        amount: Number(initialData.amount) || 0,
        transactionType: initialData.transactionType || "debit",
        category: initialData.category || "",
        description: initialData.description || "",
        date: getDefaultDate(initialData.date),
      });
    }
  }, [isOpen, initialData, reset]);

  const currentType = watch("transactionType");

  const onSubmitForm = (values: VoiceConfirmationFormValues) => {
    onConfirm(values);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Mic className="h-4 w-4" />
            <span>Voice Extraction Complete</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Review Parsed Details
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Review and edit the fields below before populating into the transaction form.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 p-6 pt-4">
          {/* Transcript Box */}
          {transcript && (
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Original Transcript
              </span>
              <p className="text-xs text-slate-700 italic">&quot;{transcript}&quot;</p>
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1.5">
            <Label htmlFor="voice-customer" className="text-slate-700 font-bold text-xs">
              Customer Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="voice-customer"
              type="text"
              placeholder="e.g. Rahul, Raj, Krish"
              aria-required="true"
              aria-invalid={Boolean(errors.customer)}
              {...register("customer")}
              className="h-10 text-sm"
              autoFocus
            />
            {errors.customer && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.customer.message}</span>
              </p>
            )}
          </div>

          {/* Amount & Transaction Type */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="voice-amount" className="text-slate-700 font-bold text-xs">
                Amount (₹) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="voice-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-required="true"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount", { valueAsNumber: true })}
                className="h-10 text-sm font-semibold"
              />
              {errors.amount && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount.message}</span>
                </p>
              )}
            </div>

            {/* Transaction Type Buttons */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-bold text-xs">Transaction Type</Label>
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200" role="radiogroup" aria-label="Transaction Type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentType === "credit"}
                  onClick={() => setValue("transactionType", "credit")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    currentType === "credit"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Credit
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentType === "debit"}
                  onClick={() => setValue("transactionType", "debit")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    currentType === "debit"
                      ? "bg-rose-600 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Debit
                </button>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="voice-category" className="text-slate-700 font-bold text-xs">
              Category
            </Label>
            <Input
              id="voice-category"
              type="text"
              placeholder="e.g. Petrol, Salary, Grocery"
              {...register("category")}
              className="h-10 text-sm"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="voice-date" className="text-slate-700 font-bold text-xs">
              Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="voice-date"
              type="date"
              aria-required="true"
              aria-invalid={Boolean(errors.date)}
              {...register("date")}
              className="h-10 text-sm"
            />
            {errors.date && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.date.message}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="voice-description" className="text-slate-700 font-bold text-xs">
              Description / Note
            </Label>
            <Input
              id="voice-description"
              type="text"
              placeholder="Short transaction description"
              {...register("description")}
              className="h-10 text-sm"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold gap-1.5 cursor-pointer text-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Populate Form</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
