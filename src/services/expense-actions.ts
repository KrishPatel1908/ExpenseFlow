"use server";

import { db } from "@db/index";
import { expenses, customers } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { expenseSchema, type ExpenseInput } from "@/schemas/expense";

export async function getExpenses(customerId?: string) {
  try {
    // Rule 1: Select only the required fields including join
    const query = db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        category: expenses.category,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        customerId: expenses.customerId,
        customerName: customers.name,
      })
      .from(expenses)
      .innerJoin(customers, eq(expenses.customerId, customers.id));

    if (customerId) {
      return await query
        .where(eq(expenses.customerId, customerId))
        .orderBy(desc(expenses.expenseDate));
    }

    return await query.orderBy(desc(expenses.expenseDate));
  } catch (error) {
    console.error("Failed to get expenses:", error);
    throw new Error("Failed to retrieve expenses");
  }
}

export async function createExpense(data: ExpenseInput) {
  try {
    const validated = expenseSchema.parse(data);

    // Rule 2: Check if customer exists directly in DB
    const customerExists = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validated.customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return { error: "Selected customer does not exist." };
    }

    await db.insert(expenses).values({
      customerId: validated.customerId,
      amount: validated.amount.toString(),
      category: validated.category || null,
      description: validated.description || null,
      expenseDate: new Date(validated.expenseDate),
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create expense:", error);
    return { error: error.message || "Failed to create expense" };
  }
}

export async function updateExpense(id: string, data: ExpenseInput) {
  try {
    const validated = expenseSchema.parse(data);

    // Rule 2: Check if customer exists directly in DB
    const customerExists = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, validated.customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return { error: "Selected customer does not exist." };
    }

    await db
      .update(expenses)
      .set({
        customerId: validated.customerId,
        amount: validated.amount.toString(),
        category: validated.category || null,
        description: validated.description || null,
        expenseDate: new Date(validated.expenseDate),
      })
      .where(eq(expenses.id, id));

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update expense:", error);
    return { error: error.message || "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete expense:", error);
    return { error: error.message || "Failed to delete expense" };
  }
}

export async function getCategories() {
  try {
    // Select distinct categories that are not null
    const results = await db
      .selectDistinct({
        category: expenses.category,
      })
      .from(expenses)
      .orderBy(expenses.category);

    return results
      .map((r) => r.category)
      .filter((c): c is string => c !== null && c !== "");
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}
