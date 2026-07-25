import { z } from "zod";

export const expenseSchema = z
  .object({
    customerName: z.string().min(2, "Customer name must be at least 2 characters"),
    customerPhone: z
      .string()
      .refine((val) => !val || val.trim() === "" || /^\d{10}$/.test(val.trim()), {
        message: "Mobile number must be a 10-digit number if provided",
      })
      .optional()
      .or(z.literal("")),
    category: z.string().optional(),
    credit: z.number().nonnegative().optional().default(0),
    debit: z.number().nonnegative().optional().default(0),
    date: z.string().min(1, "Date is required"),
    note: z.string().optional(),
  })
  .refine((data) => (data.credit || 0) > 0 || (data.debit || 0) > 0, {
    message: "Transaction amount must be greater than zero",
    path: ["credit"],
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;
