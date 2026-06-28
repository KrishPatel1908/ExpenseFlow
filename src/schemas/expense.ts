import { z } from "zod";

export const expenseSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
  category: z.string().optional(),
  credit: z.number().nonnegative().optional().default(0),
  debit: z.number().nonnegative().optional().default(0),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
