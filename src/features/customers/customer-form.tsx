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
import { customerSchema, type CustomerInput } from "@/schemas/customer";
import { createCustomer, updateCustomer } from "@/services/customer-actions";

interface CustomerFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    name: string;
    phone: string;
    monthlyBudget: string;
    yearlyBudget: string;
    notes?: string | null;
  } | null;
  onSuccess: () => void;
}

export function CustomerForm({ isOpen, onOpenChange, initialData, onSuccess }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      monthlyBudget: undefined,
      yearlyBudget: undefined,
      notes: "",
    },
  });

  // Reset form when initialData changes or dialog closes/opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || "",
        phone: initialData?.phone || "",
        monthlyBudget: initialData ? parseFloat(initialData.monthlyBudget) : undefined,
        yearlyBudget: initialData ? parseFloat(initialData.yearlyBudget) : undefined,
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: CustomerInput) => {
    setIsSubmitting(true);
    try {
      const result = initialData
        ? await updateCustomer(initialData.id, data)
        : await createCustomer(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(initialData ? "Customer updated successfully!" : "Customer created successfully!");
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
            {initialData ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update the customer's information below." 
              : "Create a new customer profile. All fields except notes are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              {...register("name")}
              className="w-full focus-visible:ring-slate-950"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              placeholder="e.g. 9876543210"
              {...register("phone")}
              className="w-full focus-visible:ring-slate-950"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyBudget">Monthly Budget (₹)</Label>
              <Input
                id="monthlyBudget"
                type="number"
                step="0.01"
                placeholder="e.g. 10000"
                {...register("monthlyBudget", { valueAsNumber: true })}
                className="w-full focus-visible:ring-slate-950"
              />
              {errors.monthlyBudget && <p className="text-xs text-red-500">{errors.monthlyBudget.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearlyBudget">Yearly Budget (₹)</Label>
              <Input
                id="yearlyBudget"
                type="number"
                step="0.01"
                placeholder="e.g. 120000"
                {...register("yearlyBudget", { valueAsNumber: true })}
                className="w-full focus-visible:ring-slate-950"
              />
              {errors.yearlyBudget && <p className="text-xs text-red-500">{errors.yearlyBudget.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add any additional details..."
              {...register("notes")}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
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
              {isSubmitting ? "Saving..." : initialData ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
