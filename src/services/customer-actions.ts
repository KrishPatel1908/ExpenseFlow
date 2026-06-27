"use server";

import { db } from "@db/index";
import { customers } from "@db/schema";
import { eq, ilike, or, and, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customerSchema, type CustomerInput } from "@/schemas/customer";

export async function getCustomers(searchQuery?: string) {
  try {
    // Rule 1: Only select fields needed for display
    const selectFields = {
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      monthlyBudget: customers.monthlyBudget,
      yearlyBudget: customers.yearlyBudget,
    };

    if (searchQuery) {
      const query = `%${searchQuery}%`;
      return await db
        .select(selectFields)
        .from(customers)
        .where(
          or(
            ilike(customers.name, query),
            ilike(customers.phone, query)
          )
        )
        .orderBy(customers.name);
    }

    return await db.select(selectFields).from(customers).orderBy(customers.name);
  } catch (error) {
    console.error("Failed to get customers:", error);
    throw new Error("Failed to retrieve customers");
  }
}

export async function getCustomerById(id: string) {
  try {
    // Rule 1: Only select fields needed for editing
    const results = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        monthlyBudget: customers.monthlyBudget,
        yearlyBudget: customers.yearlyBudget,
        notes: customers.notes,
      })
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to get customer by id:", error);
    throw new Error("Failed to retrieve customer");
  }
}

export async function createCustomer(data: CustomerInput) {
  try {
    const validated = customerSchema.parse(data);

    // Rule 2: Check existence directly in DB using limit(1)
    const phoneExists = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, validated.phone))
      .limit(1);

    if (phoneExists.length > 0) {
      return { error: "A customer with this phone number already exists." };
    }

    await db.insert(customers).values({
      name: validated.name,
      phone: validated.phone,
      monthlyBudget: validated.monthlyBudget.toString(),
      yearlyBudget: validated.yearlyBudget.toString(),
      notes: validated.notes ?? null,
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    return { error: error.message || "Failed to create customer" };
  }
}

export async function updateCustomer(id: string, data: CustomerInput) {
  try {
    const validated = customerSchema.parse(data);

    // Rule 2: Check if phone exists on another customer directly in DB
    const phoneExists = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.phone, validated.phone),
          not(eq(customers.id, id))
        )
      )
      .limit(1);

    if (phoneExists.length > 0) {
      return { error: "Another customer with this phone number already exists." };
    }

    await db
      .update(customers)
      .set({
        name: validated.name,
        phone: validated.phone,
        monthlyBudget: validated.monthlyBudget.toString(),
        yearlyBudget: validated.yearlyBudget.toString(),
        notes: validated.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    return { error: error.message || "Failed to update customer" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    return { error: error.message || "Failed to delete customer" };
  }
}
