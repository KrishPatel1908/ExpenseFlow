import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must be less than 15 digits")
    .regex(/^\+?[0-9\s\-]+$/, "Invalid mobile number format"),
  monthlyBudget: z.number({ message: "Monthly budget must be a number" })
    .positive("Monthly budget must be a positive number")
    .max(10000000, "Budget cannot exceed 10,000,000"),
  yearlyBudget: z.number({ message: "Yearly budget must be a number" })
    .positive("Yearly budget must be a positive number")
    .max(100000000, "Budget cannot exceed 100,000,000"),
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
