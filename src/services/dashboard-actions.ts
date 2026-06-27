"use server";

import { db } from "@db/index";
import { customers, expenses } from "@db/schema";
import { count, sum, and, gte, lte, eq, desc } from "drizzle-orm";

export async function getDashboardStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Rule 1: Get total customers count directly from DB
    const customerCountRes = await db
      .select({ count: count() })
      .from(customers);
    const totalCustomers = customerCountRes[0]?.count || 0;

    // Rule 1: Get sum of monthly budgets directly from DB
    const monthlyBudgetRes = await db
      .select({ sum: sum(customers.monthlyBudget) })
      .from(customers);
    const totalMonthlyBudget = parseFloat(monthlyBudgetRes[0]?.sum || "0");

    // Rule 1: Get sum of expenses in the current month directly from DB
    const monthlyExpenseRes = await db
      .select({ sum: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, startOfMonth),
          lte(expenses.expenseDate, endOfMonth)
        )
      );
    const totalMonthlyExpense = parseFloat(monthlyExpenseRes[0]?.sum || "0");

    const remainingBudget = totalMonthlyBudget - totalMonthlyExpense;

    return {
      totalCustomers,
      totalMonthlyBudget,
      totalMonthlyExpense,
      remainingBudget,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load dashboard metrics");
  }
}

export async function getMonthlyTrend() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Rule 1: Fetch only date and amount columns for trend processing
    const yearExpenses = await db
      .select({
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, startOfYear),
          lte(expenses.expenseDate, endOfYear)
        )
      );

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const trendData = monthNames.map((month, index) => {
      const amount = yearExpenses
        .filter((e) => new Date(e.expenseDate).getMonth() === index)
        .reduce((acc, e) => acc + parseFloat(e.amount), 0);

      return {
        month,
        amount,
      };
    });

    return trendData;
  } catch (error) {
    console.error("Failed to fetch monthly trend:", error);
    throw new Error("Failed to load expense trend analytics");
  }
}

export async function getRecentExpenses() {
  try {
    // Rule 1: Select only the required columns for audit list
    return await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        category: expenses.category,
        expenseDate: expenses.expenseDate,
        customerName: customers.name,
      })
      .from(expenses)
      .innerJoin(customers, eq(expenses.customerId, customers.id))
      .orderBy(desc(expenses.expenseDate))
      .limit(5);
  } catch (error) {
    console.error("Failed to fetch recent expenses:", error);
    throw new Error("Failed to load recent expenses trail");
  }
}
