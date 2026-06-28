"use server";

import { db } from "@db/index";
import { expenses } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { expenseSchema, type ExpenseInput } from "@/schemas/expense";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper to get the logged-in user ID securely
async function getRequiredUserId() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized access. Please sign in.");
  }
  return user.id;
}

export async function getExpenses() {
  try {
    const userId = await getRequiredUserId();
    return await db
      .select({
        id: expenses.id,
        customerName: expenses.customerName,
        customerPhone: expenses.customerPhone,
        category: expenses.category,
        credit: expenses.credit,
        debit: expenses.debit,
        date: expenses.date,
        note: expenses.note,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date));
  } catch (error) {
    console.error("Failed to get expenses:", error);
    throw new Error("Failed to retrieve expenses");
  }
}

export async function getDistinctCustomers() {
  try {
    const userId = await getRequiredUserId();
    const results = await db
      .selectDistinct({
        customerName: expenses.customerName,
        customerPhone: expenses.customerPhone,
        category: expenses.category,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(expenses.customerName);
    return results;
  } catch (error) {
    console.error("Failed to get distinct customers:", error);
    return [];
  }
}

export async function createExpense(data: ExpenseInput) {
  try {
    const userId = await getRequiredUserId();
    const validated = expenseSchema.parse(data);

    // Check if a record with the same customerName and customerPhone already exists FOR THIS ADMIN
    const existing = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.customerName, validated.customerName),
          eq(expenses.customerPhone, validated.customerPhone)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // If it exists, add the new credit and debit values to the previous values
      const record = existing[0];
      const newCredit = (parseFloat(record.credit) + (validated.credit ?? 0)).toString();
      const newDebit = (parseFloat(record.debit) + (validated.debit ?? 0)).toString();
      
      // Append the new note to the existing note if provided
      let updatedNote = record.note;
      if (validated.note) {
        updatedNote = record.note ? `${record.note} | ${validated.note}` : validated.note;
      }

      await db
        .update(expenses)
        .set({
          credit: newCredit,
          debit: newDebit,
          date: new Date(validated.date),
          note: updatedNote,
          category: validated.category || record.category // preserve category if not supplied
        })
        .where(
          and(
            eq(expenses.id, record.id),
            eq(expenses.userId, userId)
          )
        );
    } else {
      // If it doesn't exist, insert a new record under this admin's userId
      await db.insert(expenses).values({
        userId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        category: validated.category || null,
        credit: (validated.credit ?? 0).toString(),
        debit: (validated.debit ?? 0).toString(),
        date: new Date(validated.date),
        note: validated.note || null,
      });
    }

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create/update expense:", error);
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return { error: message };
  }
}

export async function updateExpense(id: string, data: ExpenseInput) {
  try {
    const userId = await getRequiredUserId();
    const validated = expenseSchema.parse(data);

    await db
      .update(expenses)
      .set({
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        category: validated.category || null,
        credit: (validated.credit ?? 0).toString(),
        debit: (validated.debit ?? 0).toString(),
        date: new Date(validated.date),
        note: validated.note || null,
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, userId)
        )
      );

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update expense:", error);
    const message = error instanceof Error ? error.message : "Failed to update expense";
    return { error: message };
  }
}

export async function deleteExpense(id: string) {
  try {
    const userId = await getRequiredUserId();
    await db.delete(expenses).where(
      and(
        eq(expenses.id, id),
        eq(expenses.userId, userId)
      )
    );
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete expense:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return { error: message };
  }
}

export async function getCategories() {
  try {
    const userId = await getRequiredUserId();
    const results = await db
      .selectDistinct({
        category: expenses.category,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(expenses.category);

    return results
      .map((r) => r.category)
      .filter((c): c is string => c !== null && c !== "");
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}
