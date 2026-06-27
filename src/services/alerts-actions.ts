"use server";

import { db } from "@db/index";
import { customers, expenses } from "@db/schema";
import { sum, gte, lte, and } from "drizzle-orm";

export interface BudgetAlert {
  customerId: string;
  customerName: string;
  monthlyBudget: number;
  yearlyBudget: number;
  currentMonthlyExpense: number;
  currentYearlyExpense: number;
  isMonthlyOverrun: boolean;
  isYearlyOverrun: boolean;
  monthlyOverrunAmount: number;
  yearlyOverrunAmount: number;
}

export async function getBudgetAlerts(): Promise<BudgetAlert[]> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // 1. Fetch monthly expenses grouped by customer
    const monthlySpentRes = await db
      .select({
        customerId: expenses.customerId,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, startOfMonth),
          lte(expenses.expenseDate, endOfMonth)
        )
      )
      .groupBy(expenses.customerId);

    // 2. Fetch yearly expenses grouped by customer
    const yearlySpentRes = await db
      .select({
        customerId: expenses.customerId,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, startOfYear),
          lte(expenses.expenseDate, endOfYear)
        )
      )
      .groupBy(expenses.customerId);

    // 3. Fetch only required customer fields
    const customersList = await db
      .select({
        id: customers.id,
        name: customers.name,
        monthlyBudget: customers.monthlyBudget,
        yearlyBudget: customers.yearlyBudget,
      })
      .from(customers);

    const alerts: BudgetAlert[] = [];

    for (const c of customersList) {
      const monthlyBudget = parseFloat(c.monthlyBudget);
      const yearlyBudget = parseFloat(c.yearlyBudget);

      const monthlyExpenseMatch = monthlySpentRes.find((m) => m.customerId === c.id);
      const currentMonthlyExpense = parseFloat(monthlyExpenseMatch?.total || "0");

      const yearlyExpenseMatch = yearlySpentRes.find((y) => y.customerId === c.id);
      const currentYearlyExpense = parseFloat(yearlyExpenseMatch?.total || "0");

      const isMonthlyOverrun = currentMonthlyExpense > monthlyBudget;
      const isYearlyOverrun = currentYearlyExpense > yearlyBudget;

      if (isMonthlyOverrun || isYearlyOverrun) {
        alerts.push({
          customerId: c.id,
          customerName: c.name,
          monthlyBudget,
          yearlyBudget,
          currentMonthlyExpense,
          currentYearlyExpense,
          isMonthlyOverrun,
          isYearlyOverrun,
          monthlyOverrunAmount: isMonthlyOverrun ? currentMonthlyExpense - monthlyBudget : 0,
          yearlyOverrunAmount: isYearlyOverrun ? currentYearlyExpense - yearlyBudget : 0,
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("Failed to fetch budget alerts:", error);
    throw new Error("Failed to load budget overrun alerts");
  }
}
