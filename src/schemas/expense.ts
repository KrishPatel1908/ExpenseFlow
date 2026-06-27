import { z } from "zod";

export const expenseSchema = z.object({
  customerId: z.string().uuid("Please select a valid customer"),
  amount: z.number({ message: "Amount must be a number" })
    .positive("Amount must be a positive number")
    .max(10000000, "Amount cannot exceed 10,000,000"),
  category: z.string().optional(),
  description: z.string().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
