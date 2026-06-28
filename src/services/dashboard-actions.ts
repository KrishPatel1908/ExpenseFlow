"use server";

import { db } from "@db/index";
import { expenses } from "@db/schema";
import { desc, sql, and, eq } from "drizzle-orm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface StatsQueryResult {
  customer_count: number | null;
  total_credit: string | null;
  total_debit: string | null;
}

interface TrendQueryResult {
  month_num: number | null;
  total_amount: string | null;
}

// Helper to get the logged-in user ID securely
async function getRequiredUserId() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized access. Please sign in.");
  }
  return user.id;
}

export async function getDashboardStats(startDate?: string, endDate?: string) {
  try {
    const userId = await getRequiredUserId();
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await db.execute(sql`
      SELECT 
        (SELECT COUNT(DISTINCT customer_name) FROM expenses WHERE user_id = ${userId})::int as customer_count,
        (SELECT COALESCE(SUM(credit), 0) 
         FROM expenses 
         WHERE user_id = ${userId}
           AND date >= ${start.toISOString()}::timestamptz 
           AND date <= ${end.toISOString()}::timestamptz)::numeric as total_credit,
        (SELECT COALESCE(SUM(debit), 0) 
         FROM expenses 
         WHERE user_id = ${userId}
           AND date >= ${start.toISOString()}::timestamptz 
           AND date <= ${end.toISOString()}::timestamptz)::numeric as total_debit
    `);

    const stats = (result[0] as unknown) as StatsQueryResult | undefined;
    const totalCustomers = stats?.customer_count ?? 0;
    const totalCredit = parseFloat(stats?.total_credit ?? "0");
    const totalDebit = parseFloat(stats?.total_debit ?? "0");
    const netBalance = totalCredit - totalDebit;

    return {
      totalCustomers,
      totalCredit,
      totalDebit,
      netBalance,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load dashboard metrics");
  }
}

export async function getMonthlyTrend(startDate?: string, endDate?: string) {
  try {
    const userId = await getRequiredUserId();
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Trend shows net balance (debit - credit) over months for this user
    const results = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM date)::int as month_num,
        COALESCE(SUM(debit - credit), 0)::numeric as total_amount
      FROM expenses
      WHERE user_id = ${userId}
        AND date >= ${start.toISOString()}::timestamptz
        AND date <= ${end.toISOString()}::timestamptz
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month_num
    `);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthMap = new Map<number, number>();
    for (const row of results) {
      const typedRow = (row as unknown) as TrendQueryResult;
      if (typedRow.month_num !== null) {
        monthMap.set(typedRow.month_num, parseFloat(typedRow.total_amount ?? "0"));
      }
    }

    return monthNames.map((month, index) => ({
      month,
      amount: monthMap.get(index + 1) ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch monthly trend:", error);
    throw new Error("Failed to load expense trend analytics");
  }
}

export async function getRecentExpenses(startDate?: string, endDate?: string) {
  try {
    const userId = await getRequiredUserId();
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return await db
      .select({
        id: expenses.id,
        credit: expenses.credit,
        debit: expenses.debit,
        category: expenses.category,
        date: expenses.date,
        customerName: expenses.customerName,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          sql`date >= ${start.toISOString()}::timestamptz AND date <= ${end.toISOString()}::timestamptz`
        )
      )
      .orderBy(desc(expenses.date))
      .limit(5);
  } catch (error) {
    console.error("Failed to fetch recent expenses:", error);
    throw new Error("Failed to load recent expenses trail");
  }
}
