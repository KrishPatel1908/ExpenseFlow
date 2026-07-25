"use client";

import { useEffect, useState } from "react";
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
import { Mic, CheckCircle2, AlertCircle, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { createVoiceTrainingRecord } from "@/services/voice-training-actions";
import { saveLearningCorrection } from "@/services/voice-learning-actions";
import { createExpense } from "@/services/expense-actions";
import type { ParsedTransaction } from "@/lib/nlp";
import { CustomerAutocomplete } from "@/components/ui/customer-autocomplete";
import { CategoryAutocomplete } from "@/components/ui/category-autocomplete";

export const voiceConfirmationSchema = z.object({
  customer: z.string().min(1, "Customer name is required"),
  customerPhone: z
    .string()
    .refine((val) => !val || val.trim() === "" || /^\d{10}$/.test(val.trim()), {
      message: "Mobile number must be a 10-digit number if provided",
    })
    .optional()
    .or(z.literal("")),
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
    customerPhone?: string;
    amount?: number;
    transactionType?: "credit" | "debit";
    category?: string;
    description?: string;
    date?: string;
    confidence?: "high" | "medium" | "low";
  } | null;
  rawParsedResult?: ParsedTransaction | null;
  onConfirm: (data: VoiceConfirmationFormValues) => void;
  onCancel?: () => void;
}

export function VoiceTransactionDialog({
  isOpen,
  onOpenChange,
  transcript = "",
  initialData,
  rawParsedResult,
  onConfirm,
  onCancel,
}: VoiceTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      customerPhone: initialData?.customerPhone || "",
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
        customerPhone: initialData.customerPhone || "",
        amount: Number(initialData.amount) || 0,
        transactionType: initialData.transactionType || "debit",
        category: initialData.category || "",
        description: initialData.description || "",
        date: getDefaultDate(initialData.date),
      });
    }
  }, [isOpen, initialData, reset]);

  const currentType = watch("transactionType");

  const onSubmitForm = async (values: VoiceConfirmationFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Directly create the transaction reusing existing createExpense server action
      const res = await createExpense({
        customerName: values.customer.trim(),
        customerPhone: values.customerPhone?.trim() || undefined,
        category: values.category.trim() || undefined,
        credit: values.transactionType === "credit" ? values.amount : 0,
        debit: values.transactionType === "debit" ? values.amount : 0,
        date: values.date,
        note: values.description.trim() || undefined,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success("Transaction created successfully!");

      // 2. Training Data & Adaptive Learning Dictionary Recording
      if (transcript.trim()) {
        const parsedCustomer = rawParsedResult?.customer || initialData?.customer || null;
        const parsedAmount = rawParsedResult?.amount ?? (initialData?.amount || null);
        const parsedTransactionType = rawParsedResult?.transactionType || initialData?.transactionType || null;
        const parsedCategory = rawParsedResult?.category || initialData?.category || null;
        const parsedDate = rawParsedResult?.date || initialData?.date || null;
        const parsedDescription = rawParsedResult?.description || initialData?.description || null;
        const confidence = rawParsedResult?.confidence || initialData?.confidence || "low";

        const finalCustomer = values.customer.trim();
        const finalAmount = values.amount;
        const finalTransactionType = values.transactionType;
        const finalCategory = values.category.trim() || null;
        const finalDate = values.date;
        const finalDescription = values.description.trim() || null;

        const customerChanged = (parsedCustomer || "").trim().toLowerCase() !== finalCustomer.toLowerCase();
        const amountChanged = Number(parsedAmount || 0) !== Number(finalAmount);
        const typeChanged = (parsedTransactionType || null) !== finalTransactionType;
        const categoryChanged = (parsedCategory || "").trim().toLowerCase() !== (finalCategory || "").toLowerCase();
        const dateChanged = (parsedDate || "") !== finalDate;
        const descChanged = (parsedDescription || "").trim().toLowerCase() !== (finalDescription || "").toLowerCase();

        const isCorrected = customerChanged || amountChanged || typeChanged || categoryChanged || dateChanged || descChanged;

        // Async save voice training record
        void createVoiceTrainingRecord({
          transcript: transcript.trim(),
          parsedCustomer,
          parsedAmount,
          parsedTransactionType,
          parsedCategory,
          parsedDate,
          parsedDescription,
          confidence,
          finalCustomer,
          finalAmount,
          finalTransactionType,
          finalCategory,
          finalDate,
          finalDescription,
          isCorrected,
        }).catch((err) => {
          console.warn("Failed to record voice training entry:", err);
        });

        // Adaptive Learning: Save correction rules if user changed customer, category, or type
        if (customerChanged && finalCustomer) {
          void saveLearningCorrection({
            phrase: transcript.trim(),
            detectedField: "customer",
            correctedValue: finalCustomer,
          });
        }
        if (categoryChanged && finalCategory) {
          void saveLearningCorrection({
            phrase: transcript.trim(),
            detectedField: "category",
            correctedValue: finalCategory,
          });
        }
        if (typeChanged && finalTransactionType) {
          void saveLearningCorrection({
            phrase: transcript.trim(),
            detectedField: "transactionType",
            correctedValue: finalTransactionType,
          });
        }
      }

      onConfirm(values);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to create expense from voice dialog:", err);
      toast.error("Failed to create expense transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            Review details below to create transaction immediately.
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

          {/* Customer Autocomplete */}
          <CustomerAutocomplete
            id="voice-customer"
            label="Customer Name"
            value={watch("customer") || ""}
            onChange={(val, selectedOption) => {
              setValue("customer", val, { shouldValidate: true });
              if (selectedOption?.customerPhone) {
                setValue("customerPhone", selectedOption.customerPhone, { shouldValidate: true });
              }
            }}
            onSelectCustomer={(c) => {
              if (c.customerPhone) {
                setValue("customerPhone", c.customerPhone, { shouldValidate: true });
              }
            }}
            required
            autoFocus
            error={errors.customer?.message}
          />

          {/* Mobile Number (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="voice-customer-phone" className="text-slate-700 font-bold text-xs">
              Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="voice-customer-phone"
                type="tel"
                placeholder="10-digit mobile number"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customerPhone)}
                {...register("customerPhone", {
                  onChange: (e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setValue("customerPhone", clean, { shouldValidate: true });
                  },
                })}
                className="pl-9 h-10 text-sm font-medium"
              />
            </div>
            {errors.customerPhone && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.customerPhone.message}</span>
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

          {/* Category Autocomplete */}
          <CategoryAutocomplete
            id="voice-category"
            label="Category"
            value={watch("category") || ""}
            onChange={(val) => setValue("category", val)}
          />

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
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold gap-1.5 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Expense...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Add Expense</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
