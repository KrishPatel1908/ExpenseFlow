"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Tag, Phone, IndianRupee, FileText, Loader2, AlertCircle } from "lucide-react";
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
import { customerSchema, type CustomerInput } from "@/schemas/customer";

export interface CustomerFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id?: string;
    name: string;
    nickname?: string | null;
    phone?: string | null;
    monthlyBudget?: number | string | null;
    notes?: string | null;
  } | null;
  onSubmit: (data: CustomerInput) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
}

export function CustomerForm({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  onSuccess,
}: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      nickname: initialData?.nickname || "",
      phone: initialData?.phone || "",
      monthlyBudget: Number(initialData?.monthlyBudget) || 0,
      notes: initialData?.notes || "",
    },
  });

  // Re-sync form fields when initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || "",
        nickname: initialData?.nickname || "",
        phone: initialData?.phone || "",
        monthlyBudget: Number(initialData?.monthlyBudget) || 0,
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmitForm = async (values: CustomerInput) => {
    setIsSubmitting(true);
    try {
      const res = await onSubmit(values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          initialData?.id
            ? "Customer profile updated successfully!"
            : "New customer added successfully!"
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch {
      toast.error("Something went wrong while saving customer details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-700" />
                <span>{initialData?.id ? "Edit Customer" : "Add New Customer"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {initialData?.id
                  ? "Update customer profile details across ExpenseFlow."
                  : "Create a new customer profile to track transactions and budgets."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Customer Name (Required) */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-name" className="text-slate-700 font-bold text-xs">
                  Customer Name <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="e.g. Rahul, Raj, Krish"
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    {...register("name")}
                    className="pl-9 h-10 text-sm"
                    autoFocus
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              {/* Monthly Budget (Required) */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-budget" className="text-slate-700 font-bold text-xs">
                  Monthly Budget (₹) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="customer-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5000"
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-invalid={Boolean(errors.monthlyBudget)}
                    {...register("monthlyBudget", { valueAsNumber: true })}
                    className="pl-9 h-10 text-sm font-semibold"
                  />
                </div>
                {errors.monthlyBudget && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.monthlyBudget.message}</span>
                  </p>
                )}
              </div>

              {/* Nickname (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-nickname" className="text-slate-700 font-bold text-xs">
                  Nickname / Branch / Location <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="customer-nickname"
                    type="text"
                    placeholder="e.g. Tea Shop, Garage, Society A"
                    disabled={isSubmitting}
                    {...register("nickname")}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
                {errors.nickname && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.nickname.message}</span>
                  </p>
                )}
              </div>

              {/* Mobile Number (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-phone" className="text-slate-700 font-bold text-xs">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="customer-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.phone)}
                    {...register("phone", {
                      onChange: (e) => {
                        const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("phone", clean, { shouldValidate: true });
                      },
                    })}
                    className="pl-9 h-10 text-sm font-medium"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.phone.message}</span>
                  </p>
                )}
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-notes" className="text-slate-700 font-bold text-xs">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    id="customer-notes"
                    placeholder="Additional notes about customer..."
                    disabled={isSubmitting}
                    {...register("notes")}
                    className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[70px]"
                  />
                </div>
                {errors.notes && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.notes.message}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold gap-2 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : initialData?.id ? (
                "Save Changes"
              ) : (
                "Create Customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
