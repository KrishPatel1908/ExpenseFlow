"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { expenseSchema, type ExpenseInput } from "@/schemas/expense";
import { createExpense, updateExpense } from "@/services/expense-actions";

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: { id: string; name: string }[];
  initialData?: {
    id: string;
    customerId: string;
    amount: string;
    category?: string | null;
    description?: string | null;
    expenseDate: Date | string;
  } | null;
  onSuccess: () => void;
}

export function ExpenseForm({ isOpen, onOpenChange, customers, initialData, onSuccess }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date to YYYY-MM-DD for HTML input
  const formatDateForInput = (dateVal: Date | string | undefined) => {
    if (!dateVal) return "";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      customerId: "",
      amount: undefined,
      category: "",
      description: "",
      expenseDate: "",
    },
  });

  // Reset form when open state or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        customerId: initialData?.customerId || "",
        amount: initialData ? parseFloat(initialData.amount) : undefined,
        category: initialData?.category || "",
        description: initialData?.description || "",
        expenseDate: formatDateForInput(initialData?.expenseDate),
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: ExpenseInput) => {
    setIsSubmitting(true);
    try {
      const result = initialData
        ? await updateExpense(initialData.id, data)
        : await createExpense(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(initialData ? "Expense updated successfully!" : "Expense recorded successfully!");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update this expense details below." 
              : "Record a new customer expense. Budget and remaining amounts will be recalculated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Customer Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <select
              id="customerId"
              {...register("customerId")}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="e.g. 2500"
                {...register("amount", { valueAsNumber: true })}
                className="w-full focus-visible:ring-slate-950"
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            {/* Expense Date */}
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Expense Date</Label>
              <Input
                id="expenseDate"
                type="date"
                {...register("expenseDate")}
                className="w-full focus-visible:ring-slate-950"
              />
              {errors.expenseDate && <p className="text-xs text-red-500">{errors.expenseDate.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g. Server Hosting, Office Supplies"
              {...register("category")}
              className="w-full focus-visible:ring-slate-950"
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="e.g. Monthly Vercel/Supabase hosting costs..."
              {...register("description")}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-950 hover:bg-slate-900 text-white font-medium"
            >
              {isSubmitting ? "Saving..." : initialData ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
