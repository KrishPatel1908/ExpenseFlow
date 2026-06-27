"use server";

import { db } from "@db/index";
import { customers, expenses } from "@db/schema";
import { eq, and, gte, lte, sum, desc } from "drizzle-orm";

export async function getCustomerDashboardStats(customerId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Rule 1: Fetch only the specific customer details needed
    const customerInfo = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        monthlyBudget: customers.monthlyBudget,
        yearlyBudget: customers.yearlyBudget,
        notes: customers.notes,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerInfo.length === 0) {
      throw new Error("Customer not found");
    }

    const customer = customerInfo[0];
    const monthlyBudgetVal = parseFloat(customer.monthlyBudget);
    const yearlyBudgetVal = parseFloat(customer.yearlyBudget);

    // Rule 1: Fetch monthly expense sum directly from DB
    const monthlyExpenseRes = await db
      .select({ sum: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.customerId, customerId),
          gte(expenses.expenseDate, startOfMonth),
          lte(expenses.expenseDate, endOfMonth)
        )
      );
    const totalMonthlyExpense = parseFloat(monthlyExpenseRes[0]?.sum || "0");

    // Rule 1: Fetch yearly expense sum directly from DB
    const yearlyExpenseRes = await db
      .select({ sum: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.customerId, customerId),
          gte(expenses.expenseDate, startOfYear),
          lte(expenses.expenseDate, endOfYear)
        )
      );
    const totalYearlyExpense = parseFloat(yearlyExpenseRes[0]?.sum || "0");

    const remainingBudget = monthlyBudgetVal - totalMonthlyExpense;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        monthlyBudget: monthlyBudgetVal,
        yearlyBudget: yearlyBudgetVal,
        notes: customer.notes,
      },
      stats: {
        totalMonthlyBudget: monthlyBudgetVal,
        totalMonthlyExpense,
        remainingBudget,
        totalYearlyBudget: yearlyBudgetVal,
        totalYearlyExpense,
      },
    };
  } catch (error) {
    console.error("Failed to fetch customer dashboard stats:", error);
    throw new Error("Failed to load customer metrics");
  }
}

export async function getCustomerMonthlyTrend(customerId: string) {
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
          eq(expenses.customerId, customerId),
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
    console.error("Failed to fetch customer monthly trend:", error);
    throw new Error("Failed to load customer trend analytics");
  }
}

export async function getCustomerExpensesList(customerId: string) {
  try {
    // Rule 1: Fetch only the required fields for list display
    return await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        category: expenses.category,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
      })
      .from(expenses)
      .where(eq(expenses.customerId, customerId))
      .orderBy(desc(expenses.expenseDate));
  } catch (error) {
    console.error("Failed to fetch customer expenses list:", error);
    throw new Error("Failed to load customer expenses");
  }
}
