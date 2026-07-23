"use server";

import { db } from "@db/index";
import { customers, expenses } from "@db/schema";
import { eq, and, sql, ilike, or, count, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customerSchema, type CustomerInput } from "@/schemas/customer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper to get logged-in user ID securely
async function getRequiredUserId() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized access. Please sign in.");
  }
  return user.id;
}

export interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CustomerWithStats {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  monthlyBudget: string;
  notes: string | null;
  createdAt: Date;
  totalExpenses: string;
  currentMonthExpenses: string;
  remainingBudget: string;
  transactionCount: number;
}

export interface GetCustomersResult {
  customers: CustomerWithStats[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch paginated, searchable, sorted customer profiles with dynamic calculations:
 * - Total Expenses: Sum of all debit expenses for customer
 * - Current Month Expenses: Sum of debit expenses in the current calendar month
 * - Remaining Budget: Monthly Budget - Current Month Expenses
 * - Transaction Count: Total transactions recorded for customer
 */
export async function getCustomers(
  params: GetCustomersParams = {}
): Promise<GetCustomersResult> {
  try {
    const userId = await getRequiredUserId();
    const {
      page = 1,
      pageSize = 10,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
    } = params;

    const offset = (page - 1) * pageSize;
    const cleanSearch = search.trim();

    // Base filter: belongs to logged-in user
    const userFilter = eq(customers.userId, userId);

    // Search filter across name, nickname, and phone
    const searchFilter = cleanSearch
      ? or(
          ilike(customers.name, `%${cleanSearch}%`),
          ilike(customers.nickname, `%${cleanSearch}%`),
          ilike(customers.phone, `%${cleanSearch}%`)
        )
      : undefined;

    const combinedFilter = searchFilter ? and(userFilter, searchFilter) : userFilter;

    // 1. Get Total Count for pagination
    const [countResult] = await db
      .select({ total: count(customers.id) })
      .from(customers)
      .where(combinedFilter);

    const totalCount = Number(countResult?.total || 0);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // 2. Sorting clause
    const sortColumn = sortBy === "createdAt" ? customers.createdAt : customers.name;
    const orderClause = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

    // 3. Fetch customer list with dynamic aggregated stats
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        nickname: customers.nickname,
        phone: customers.phone,
        monthlyBudget: customers.monthlyBudget,
        notes: customers.notes,
        createdAt: customers.createdAt,
        totalExpenses: sql<string>`COALESCE(SUM(CAST(${expenses.debit} AS NUMERIC)), 0)::text`,
        currentMonthExpenses: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.date} >= date_trunc('month', NOW()) AND ${expenses.date} < date_trunc('month', NOW()) + INTERVAL '1 month' THEN CAST(${expenses.debit} AS NUMERIC) ELSE 0 END), 0)::text`,
        remainingBudget: sql<string>`(CAST(${customers.monthlyBudget} AS NUMERIC) - COALESCE(SUM(CASE WHEN ${expenses.date} >= date_trunc('month', NOW()) AND ${expenses.date} < date_trunc('month', NOW()) + INTERVAL '1 month' THEN CAST(${expenses.debit} AS NUMERIC) ELSE 0 END), 0))::text`,
        transactionCount: sql<number>`CAST(COUNT(${expenses.id}) AS INTEGER)`,
      })
      .from(customers)
      .leftJoin(expenses, eq(customers.id, expenses.customerId))
      .where(combinedFilter)
      .groupBy(
        customers.id,
        customers.name,
        customers.nickname,
        customers.phone,
        customers.monthlyBudget,
        customers.notes,
        customers.createdAt
      )
      .orderBy(orderClause)
      .limit(pageSize)
      .offset(offset);

    return {
      customers: rows,
      totalCount,
      totalPages,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw new Error("Failed to retrieve customer profiles.");
  }
}

/**
 * Create a new customer profile
 */
export async function createCustomer(data: CustomerInput) {
  try {
    const userId = await getRequiredUserId();
    const validated = customerSchema.parse(data);

    // Check if phone already exists for another customer if phone is provided
    if (validated.phone && validated.phone.trim()) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.userId, userId),
            eq(customers.phone, validated.phone.trim())
          )
        )
        .limit(1);

      if (existingPhone.length > 0) {
        return { error: "A customer with this mobile number already exists." };
      }
    }

    await db.insert(customers).values({
      userId,
      name: validated.name,
      nickname: validated.nickname || null,
      phone: validated.phone || null,
      monthlyBudget: validated.monthlyBudget.toString(),
      notes: validated.notes || null,
    });

    revalidatePath("/customers");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create customer:", error);
    const message = error instanceof Error ? error.message : "Failed to create customer profile.";
    return { error: message };
  }
}

/**
 * Update existing customer profile
 */
export async function updateCustomerProfile(id: string, data: CustomerInput) {
  try {
    const userId = await getRequiredUserId();
    const validated = customerSchema.parse(data);

    // Check if phone belongs to another customer if phone is provided
    if (validated.phone && validated.phone.trim()) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.userId, userId),
            eq(customers.phone, validated.phone.trim()),
            sql`${customers.id} != ${id}`
          )
        )
        .limit(1);

      if (existingPhone.length > 0) {
        return { error: "A customer with this mobile number already exists." };
      }
    }

    await db
      .update(customers)
      .set({
        name: validated.name,
        nickname: validated.nickname || null,
        phone: validated.phone || null,
        monthlyBudget: validated.monthlyBudget.toString(),
        notes: validated.notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));

    revalidatePath("/customers");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update customer:", error);
    const message = error instanceof Error ? error.message : "Failed to update customer profile.";
    return { error: message };
  }
}

/**
 * Delete a customer profile.
 * Rule: Check directly in DB if customer has existing transactions.
 * If transactions exist, prevent deletion and return friendly error.
 */
export async function deleteCustomerProfile(id: string) {
  try {
    const userId = await getRequiredUserId();

    // Check directly in DB if customer has existing expenses
    const [expenseCount] = await db
      .select({ count: sql<number>`CAST(COUNT(${expenses.id}) AS INTEGER)` })
      .from(expenses)
      .where(and(eq(expenses.customerId, id), eq(expenses.userId, userId)));

    if (expenseCount && expenseCount.count > 0) {
      return {
        error: "This customer has transactions. Delete the transactions first.",
      };
    }

    // Delete customer from DB
    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));

    revalidatePath("/customers");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete customer:", error);
    const message = error instanceof Error ? error.message : "Failed to delete customer profile.";
    return { error: message };
  }
}
