import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be less than 100 characters")
    .trim(),
  nickname: z
    .string()
    .max(50, "Nickname must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .refine((val) => !val || val.trim() === "" || /^\d{10}$/.test(val.trim()), {
      message: "Mobile number must be exactly 10 digits if entered",
    })
    .optional()
    .or(z.literal("")),
  monthlyBudget: z
    .number({ message: "Monthly budget is required" })
    .positive("Monthly budget must be a positive number"),
  notes: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
