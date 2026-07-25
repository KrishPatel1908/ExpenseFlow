"use server";

import { db } from "@db/index";
import { expenses, customers } from "@db/schema";
import { eq, desc, asc, and, sql, ilike, count, gte, lte, gt } from "drizzle-orm";
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

export interface GetExpensesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  typeFilter?: "all" | "credit" | "debit";
  categoryFilter?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ExpenseItem {
  id: string;
  customerName: string;
  customerPhone: string | null;
  category: string | null;
  credit: string;
  debit: string;
  netBalance: string;
  date: Date;
  note: string | null;
}

export interface GetExpensesResult {
  expenses: ExpenseItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch paginated, filtered, searchable, sorted transactions for logged in user.
 */
export async function getExpenses(
  params: GetExpensesParams = {}
): Promise<GetExpensesResult> {
  try {
    const userId = await getRequiredUserId();
    const {
      page = 1,
      pageSize = 10,
      search = "",
      typeFilter = "all",
      categoryFilter = "",
      startDate = "",
      endDate = "",
      sortOrder = "desc",
    } = params;

    const offset = (page - 1) * pageSize;
    const cleanSearch = search.trim();

    // Construct SQL Filters
    const filters = [eq(expenses.userId, userId)];

    if (cleanSearch) {
      filters.push(ilike(customers.name, `%${cleanSearch}%`));
    }

    if (typeFilter === "credit") {
      filters.push(gt(expenses.credit, "0"));
    } else if (typeFilter === "debit") {
      filters.push(gt(expenses.debit, "0"));
    }

    if (categoryFilter && categoryFilter.trim()) {
      filters.push(eq(expenses.category, categoryFilter.trim()));
    }

    if (startDate && startDate.trim()) {
      filters.push(gte(expenses.date, new Date(startDate.trim())));
    }

    if (endDate && endDate.trim()) {
      const end = new Date(endDate.trim());
      end.setHours(23, 59, 59, 999);
      filters.push(lte(expenses.date, end));
    }

    const combinedWhere = and(...filters);

    // 1. Get total count for pagination
    const [countRes] = await db
      .select({ total: count(expenses.id) })
      .from(expenses)
      .innerJoin(customers, eq(expenses.customerId, customers.id))
      .where(combinedWhere);

    const totalCount = Number(countRes?.total || 0);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // 2. Fetch paginated expense items with cumulative balance
    const rows = await db
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
      .where(combinedWhere)
      .orderBy(
        sortOrder === "asc"
          ? asc(expenses.date)
          : desc(expenses.date),
        desc(expenses.createdAt)
      )
      .limit(pageSize)
      .offset(offset);

    return {
      expenses: rows,
      totalCount,
      totalPages,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to get expenses:", error);
    throw new Error("Failed to retrieve expenses list");
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

    // Check if customer already exists for this admin by phone or name
    const existing = validated.customerPhone && validated.customerPhone.trim()
      ? await db
          .select({ id: customers.id, name: customers.name, phone: customers.phone })
          .from(customers)
          .where(
            and(
              eq(customers.userId, userId),
              eq(customers.phone, validated.customerPhone)
            )
          )
          .limit(1)
      : await db
          .select({ id: customers.id, name: customers.name, phone: customers.phone })
          .from(customers)
          .where(
            and(
              eq(customers.userId, userId),
              eq(customers.name, validated.customerName)
            )
          )
          .limit(1);

    let customerId: string;
    if (existing.length > 0) {
      customerId = existing[0].id;
      const updates: { name?: string; phone?: string; updatedAt: Date } = { updatedAt: new Date() };
      if (existing[0].name !== validated.customerName) {
        updates.name = validated.customerName;
      }
      if (validated.customerPhone && validated.customerPhone.trim() && existing[0].phone !== validated.customerPhone.trim()) {
        updates.phone = validated.customerPhone.trim();
      }
      if (Object.keys(updates).length > 1) {
        await db
          .update(customers)
          .set(updates)
          .where(eq(customers.id, customerId));
      }
    } else {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: validated.customerName,
          phone: validated.customerPhone || null,
        })
        .returning({ id: customers.id });
      customerId = newCustomer.id;
    }

    const creditVal = validated.credit ?? 0;
    const debitVal = validated.debit ?? 0;
    const netBalanceVal = debitVal - creditVal;

    await db.insert(expenses).values({
      userId,
      customerId,
      category: validated.category || null,
      credit: creditVal.toString(),
      debit: debitVal.toString(),
      netBalance: netBalanceVal.toString(),
      date: new Date(validated.date),
      note: validated.note || null,
      updatedAt: new Date(),
    });

    revalidatePath("/expenses");
    revalidatePath("/customers");
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

    const existingCustomer = validated.customerPhone && validated.customerPhone.trim()
      ? await db
          .select({ id: customers.id, name: customers.name, phone: customers.phone })
          .from(customers)
          .where(
            and(
              eq(customers.userId, userId),
              eq(customers.phone, validated.customerPhone)
            )
          )
          .limit(1)
      : await db
          .select({ id: customers.id, name: customers.name, phone: customers.phone })
          .from(customers)
          .where(
            and(
              eq(customers.userId, userId),
              eq(customers.name, validated.customerName)
            )
          )
          .limit(1);

    let customerId: string;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      const updates: { name?: string; phone?: string; updatedAt: Date } = { updatedAt: new Date() };
      if (existingCustomer[0].name !== validated.customerName) {
        updates.name = validated.customerName;
      }
      if (validated.customerPhone && validated.customerPhone.trim() && existingCustomer[0].phone !== validated.customerPhone.trim()) {
        updates.phone = validated.customerPhone.trim();
      }
      if (Object.keys(updates).length > 1) {
        await db
          .update(customers)
          .set(updates)
          .where(eq(customers.id, customerId));
      }
    } else {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: validated.customerName,
          phone: validated.customerPhone || null,
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
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, userId)
        )
      );

    revalidatePath("/expenses");
    revalidatePath("/customers");
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
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete expense:", error);
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return { error: message };
  }
}

/**
 * Permanently deletes ALL transactions belonging to the current user.
 */
export async function deleteAllExpenses() {
  try {
    const userId = await getRequiredUserId();

    const deletedRows = await db
      .delete(expenses)
      .where(eq(expenses.userId, userId))
      .returning({ id: expenses.id });

    revalidatePath("/expenses");
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true, deletedCount: deletedRows.length };
  } catch (error: unknown) {
    console.error("Failed to delete all expenses:", error);
    const message = error instanceof Error ? error.message : "Failed to delete transactions.";
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
        nickname: customers.nickname,
        phone: customers.phone,
        monthlyBudget: customers.monthlyBudget,
        notes: customers.notes,
        netBalance: sql<string>`COALESCE(SUM(CAST(${expenses.debit} AS NUMERIC) - CAST(${expenses.credit} AS NUMERIC)), 0)::text`,
      })
      .from(customers)
      .leftJoin(expenses, eq(customers.id, expenses.customerId))
      .where(eq(customers.userId, userId))
      .groupBy(
        customers.id,
        customers.name,
        customers.nickname,
        customers.phone,
        customers.monthlyBudget,
        customers.notes
      )
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

export async function updateCustomer(
  id: string,
  nameOrData:
    | string
    | {
        name: string;
        nickname?: string | null;
        phone?: string | null;
        monthlyBudget?: number | string | null;
        notes?: string | null;
      },
  phoneParam?: string
) {
  try {
    const userId = await getRequiredUserId();

    let name: string;
    let nickname: string | null = null;
    let phone: string | null = null;
    let monthlyBudget: string = "0";
    let notes: string | null = null;

    if (typeof nameOrData === "string") {
      name = nameOrData;
      phone = phoneParam || null;
    } else {
      name = nameOrData.name;
      nickname = nameOrData.nickname || null;
      phone = nameOrData.phone || null;
      monthlyBudget = (nameOrData.monthlyBudget ?? 0).toString();
      notes = nameOrData.notes || null;
    }

    if (name.trim().length < 2) {
      return { error: "Customer name must be at least 2 characters." };
    }
    if (phone && phone.trim().length > 0 && phone.trim().length !== 10) {
      return { error: "Mobile number must be exactly 10 digits if provided." };
    }

    await db
      .update(customers)
      .set({
        name,
        nickname,
        phone: phone || null,
        monthlyBudget,
        notes,
        updatedAt: new Date(),
      })
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
