"use server";

import { db } from "@db/index";
import { expenses, customers } from "@db/schema";
import { eq, desc, and, sql, not } from "drizzle-orm";
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
        customerName: customers.name,
        customerPhone: customers.phone,
        category: expenses.category,
        credit: expenses.credit,
        debit: expenses.debit,
        netBalance: sql<string>`SUM(CAST(${expenses.debit} AS NUMERIC) - CAST(${expenses.credit} AS NUMERIC)) OVER (
          PARTITION BY ${expenses.customerId}
          ORDER BY ${expenses.date} ASC, ${expenses.createdAt} ASC
        )::text`,
        date: expenses.date,
        note: expenses.note,
      })
      .from(expenses)
      .innerJoin(customers, eq(expenses.customerId, customers.id))
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date), desc(expenses.createdAt));
  } catch (error) {
    console.error("Failed to get expenses:", error);
    throw new Error("Failed to retrieve expenses");
  }
}

export async function getDistinctCustomers() {
  try {
    const userId = await getRequiredUserId();
    const results = await db
      .select({
        customerName: customers.name,
        customerPhone: customers.phone,
        category: sql<string | null>`(
          SELECT category 
          FROM ${expenses} 
          WHERE customer_id = ${customers.id} 
            AND category IS NOT NULL 
            AND category != ''
          ORDER BY date DESC 
          LIMIT 1
        )`
      })
      .from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(customers.name);
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

    // Check if customer already exists for this admin by phone number
    const existing = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(
        and(
          eq(customers.userId, userId),
          eq(customers.phone, validated.customerPhone)
        )
      )
      .limit(1);

    let customerId: string;
    if (existing.length > 0) {
      customerId = existing[0].id;
      // If the name has changed, update it to the new name
      if (existing[0].name !== validated.customerName) {
        await db
          .update(customers)
          .set({ name: validated.customerName })
          .where(eq(customers.id, customerId));
      }
    } else {
      // If it doesn't exist, insert a new customer
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: validated.customerName,
          phone: validated.customerPhone,
        })
        .returning({ id: customers.id });
      customerId = newCustomer.id;
    }

    const creditVal = validated.credit ?? 0;
    const debitVal = validated.debit ?? 0;
    const netBalanceVal = debitVal - creditVal;

    // Always insert a new transaction record
    await db.insert(expenses).values({
      userId,
      customerId,
      category: validated.category || null,
      credit: creditVal.toString(),
      debit: debitVal.toString(),
      netBalance: netBalanceVal.toString(),
      date: new Date(validated.date),
      note: validated.note || null,
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create expense:", error);
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return { error: message };
  }
}

export async function updateExpense(id: string, data: ExpenseInput) {
  try {
    const userId = await getRequiredUserId();
    const validated = expenseSchema.parse(data);

    // Check if customer already exists for this admin by phone number
    const existingCustomer = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(
        and(
          eq(customers.userId, userId),
          eq(customers.phone, validated.customerPhone)
        )
      )
      .limit(1);

    let customerId: string;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      // If the name has changed, update it to the new name
      if (existingCustomer[0].name !== validated.customerName) {
        await db
          .update(customers)
          .set({ name: validated.customerName })
          .where(eq(customers.id, customerId));
      }
    } else {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: validated.customerName,
          phone: validated.customerPhone,
        })
        .returning({ id: customers.id });
      customerId = newCustomer.id;
    }

    const creditVal = validated.credit ?? 0;
    const debitVal = validated.debit ?? 0;
    const netBalanceVal = debitVal - creditVal;

    await db
      .update(expenses)
      .set({
        customerId,
        category: validated.category || null,
        credit: creditVal.toString(),
        debit: debitVal.toString(),
        netBalance: netBalanceVal.toString(),
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

export async function getCustomersWithBalances() {
  try {
    const userId = await getRequiredUserId();
    return await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        netBalance: sql<string>`COALESCE(SUM(CAST(${expenses.debit} AS NUMERIC) - CAST(${expenses.credit} AS NUMERIC)), 0)::text`,
      })
      .from(customers)
      .leftJoin(expenses, eq(customers.id, expenses.customerId))
      .where(eq(customers.userId, userId))
      .groupBy(customers.id, customers.name, customers.phone)
      .orderBy(customers.name);
  } catch (error) {
    console.error("Failed to get customers with balances:", error);
    throw new Error("Failed to retrieve customers list");
  }
}

export async function deleteCustomer(id: string) {
  try {
    const userId = await getRequiredUserId();
    await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, userId)
        )
      );
    revalidatePath("/customers");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete customer:", error);
    const message = error instanceof Error ? error.message : "Failed to delete customer";
    return { error: message };
  }
}

export async function updateCustomer(id: string, name: string, phone: string) {
  try {
    const userId = await getRequiredUserId();
    
    // 1. Validate inputs
    if (name.trim().length < 2) {
      return { error: "Customer name must be at least 2 characters." };
    }
    if (phone.trim().length !== 10) {
      return { error: "Mobile number must be exactly 10 digits." };
    }

    // 2. Check if another customer already has this phone number
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.userId, userId),
          eq(customers.phone, phone),
          not(eq(customers.id, id))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { error: "A customer with this mobile number already exists." };
    }

    // 3. Update the customer
    await db
      .update(customers)
      .set({ name, phone })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, userId)
        )
      );

    revalidatePath("/customers");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update customer:", error);
    const message = error instanceof Error ? error.message : "Failed to update customer";
    return { error: message };
  }
}
