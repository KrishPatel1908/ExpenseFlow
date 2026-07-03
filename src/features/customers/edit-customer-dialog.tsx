"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { updateCustomer } from "@/services/expense-actions";
import { type Customer } from "./customer-table";
import { toast } from "sonner";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function EditCustomerDialog({ open, onOpenChange, customer, onSuccess }: EditCustomerDialogProps) {
  const [editName, setEditName] = useState(customer?.name ?? "");
  const [editPhone, setEditPhone] = useState(customer?.phone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync fields when customer changes
  const handleOpenChange = (val: boolean) => {
    if (val && customer) {
      setEditName(customer.name);
      setEditPhone(customer.phone);
    }
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (editName.trim().length < 2) {
      toast.error("Customer name must be at least 2 characters.");
      return;
    }
    if (editPhone.trim().length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCustomer(customer.id, editName, editPhone);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Customer updated successfully!");
        onOpenChange(false);
        onSuccess();
      }
    } catch {
      toast.error("Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                {"Update the customer's name and mobile number. Changes will reflect instantly across all transactions."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-slate-700 font-bold">Customer Name</Label>
                <Input
                  id="editName"
                  type="text"
                  placeholder="Enter name..."
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPhone" className="text-slate-700 font-bold">Mobile Number</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  placeholder="10-digit mobile..."
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-10 text-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
