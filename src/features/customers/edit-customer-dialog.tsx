"use client";

import { CustomerForm } from "./customer-form";
import { updateCustomer } from "@/services/expense-actions";
import { type Customer } from "./customer-table";
import { type CustomerInput } from "@/schemas/customer";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: EditCustomerDialogProps) {
  const handleSubmit = async (data: CustomerInput) => {
    if (!customer) return { error: "No customer selected." };
    return await updateCustomer(customer.id, data);
  };

  return (
    <CustomerForm
      isOpen={open}
      onOpenChange={onOpenChange}
      initialData={customer}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  );
}
