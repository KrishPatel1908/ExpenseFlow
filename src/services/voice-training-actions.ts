"use server";

import { db } from "@db/index";
import { voiceTraining } from "@db/schema";
import { eq, and, ilike, or, count, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/constants";

// Helper to get logged-in user ID and Email securely
async function getRequiredUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized access. Please sign in.");
  }
  return { id: user.id, email: user.email || "" };
}

// Server-side admin authorization check
export async function verifyAdminUser() {
  const user = await getRequiredUser();
  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("403 Forbidden: Developer access only for admin@gmail.com");
  }
  return user;
}

export interface CreateVoiceTrainingInput {
  transcript: string;
  parsedCustomer?: string | null;
  parsedAmount?: number | null;
  parsedTransactionType?: "credit" | "debit" | null;
  parsedCategory?: string | null;
  parsedDate?: string | null;
  parsedDescription?: string | null;
  confidence: "high" | "medium" | "low";
  finalCustomer?: string | null;
  finalAmount?: number | null;
  finalTransactionType?: "credit" | "debit" | null;
  finalCategory?: string | null;
  finalDate?: string | null;
  finalDescription?: string | null;
  isCorrected: boolean;
}

export interface GetVoiceTrainingParams {
  page?: number;
  pageSize?: number;
  search?: string;
  userEmailFilter?: string;
  confidenceFilter?: "all" | "high" | "medium" | "low";
  correctedFilter?: "all" | "corrected" | "uncorrected";
}

export interface VoiceTrainingItem {
  id: string;
  userId: string;
  userEmail: string | null;
  transcript: string;
  parsedCustomer: string | null;
  parsedAmount: string | null;
  parsedTransactionType: string | null;
  parsedCategory: string | null;
  parsedDate: string | null;
  parsedDescription: string | null;
  confidence: string;
  finalCustomer: string | null;
  finalAmount: string | null;
  finalTransactionType: string | null;
  finalCategory: string | null;
  finalDate: string | null;
  finalDescription: string | null;
  isCorrected: boolean;
  createdAt: Date;
}

/**
 * Creates a voice training record storing parsed vs user-confirmed values.
 * Collects data from ALL authenticated users along with user_id and user_email.
 * Does NOT create an expense transaction.
 */
export async function createVoiceTrainingRecord(input: CreateVoiceTrainingInput) {
  try {
    const user = await getRequiredUser();

    if (!input.transcript || !input.transcript.trim()) {
      return { error: "Transcript is required for voice training." };
    }

    const [inserted] = await db
      .insert(voiceTraining)
      .values({
        userId: user.id,
        userEmail: user.email || null,
        transcript: input.transcript.trim(),
        parsedCustomer: input.parsedCustomer || null,
        parsedAmount: input.parsedAmount !== undefined && input.parsedAmount !== null ? String(input.parsedAmount) : null,
        parsedTransactionType: input.parsedTransactionType || null,
        parsedCategory: input.parsedCategory || null,
        parsedDate: input.parsedDate || null,
        parsedDescription: input.parsedDescription || null,
        confidence: input.confidence,
        finalCustomer: input.finalCustomer || null,
        finalAmount: input.finalAmount !== undefined && input.finalAmount !== null ? String(input.finalAmount) : null,
        finalTransactionType: input.finalTransactionType || null,
        finalCategory: input.finalCategory || null,
        finalDate: input.finalDate || null,
        finalDescription: input.finalDescription || null,
        isCorrected: input.isCorrected,
      })
      .returning({ id: voiceTraining.id });

    revalidatePath("/voice-training");
    return { success: true, id: inserted.id };
  } catch (err: unknown) {
    console.error("Error creating voice training record:", err);
    const msg = err instanceof Error ? err.message : "Failed to record voice training data.";
    return { error: msg };
  }
}

/**
 * Fetches paginated voice training records.
 * Super Admin (admin@gmail.com) receives records across ALL users.
 * Normal users receive only their OWN records.
 * AUTHORIZATION: Enforced strictly server-side.
 */
export async function getVoiceTrainingRecords(params: GetVoiceTrainingParams = {}) {
  try {
    const user = await getRequiredUser();
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Security scope: Non-admin users can ONLY query their own records
    if (!isAdmin) {
      conditions.push(eq(voiceTraining.userId, user.id));
    }

    // Search by transcript OR userEmail
    if (params.search && params.search.trim() !== "") {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(voiceTraining.transcript, q),
          ilike(voiceTraining.userEmail, q)
        )
      );
    }

    if (params.userEmailFilter && params.userEmailFilter.trim() !== "" && params.userEmailFilter !== "all") {
      conditions.push(eq(voiceTraining.userEmail, params.userEmailFilter.trim()));
    }

    if (params.confidenceFilter && params.confidenceFilter !== "all") {
      conditions.push(eq(voiceTraining.confidence, params.confidenceFilter));
    }

    if (params.correctedFilter && params.correctedFilter !== "all") {
      conditions.push(eq(voiceTraining.isCorrected, params.correctedFilter === "corrected"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch total count matching filters
    const [countResult] = await db
      .select({ count: count(voiceTraining.id) })
      .from(voiceTraining)
      .where(whereClause);

    const totalCount = Number(countResult?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Fetch paginated rows with explicit column selection
    const records = await db
      .select({
        id: voiceTraining.id,
        userId: voiceTraining.userId,
        userEmail: voiceTraining.userEmail,
        transcript: voiceTraining.transcript,
        parsedCustomer: voiceTraining.parsedCustomer,
        parsedAmount: voiceTraining.parsedAmount,
        parsedTransactionType: voiceTraining.parsedTransactionType,
        parsedCategory: voiceTraining.parsedCategory,
        parsedDate: voiceTraining.parsedDate,
        parsedDescription: voiceTraining.parsedDescription,
        confidence: voiceTraining.confidence,
        finalCustomer: voiceTraining.finalCustomer,
        finalAmount: voiceTraining.finalAmount,
        finalTransactionType: voiceTraining.finalTransactionType,
        finalCategory: voiceTraining.finalCategory,
        finalDate: voiceTraining.finalDate,
        finalDescription: voiceTraining.finalDescription,
        isCorrected: voiceTraining.isCorrected,
        createdAt: voiceTraining.createdAt,
      })
      .from(voiceTraining)
      .where(whereClause)
      .orderBy(desc(voiceTraining.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Fetch distinct user emails for filter dropdown
    const distinctEmailsResult = await db
      .select({ email: voiceTraining.userEmail })
      .from(voiceTraining)
      .where(isAdmin ? undefined : eq(voiceTraining.userId, user.id))
      .groupBy(voiceTraining.userEmail);

    const distinctUserEmails = distinctEmailsResult
      .map((row) => row.email)
      .filter((e): e is string => Boolean(e && e.trim()));

    return {
      records,
      totalCount,
      totalPages,
      distinctUserEmails,
    };
  } catch (err: unknown) {
    console.error("Error fetching voice training records:", err);
    throw err;
  }
}

/**
 * Permanently deletes a single voice training record.
 * Super Admin (admin@gmail.com) can delete ANY record.
 * Normal users can ONLY delete their OWN record.
 * SECURITY: Enforced strictly server-side.
 */
export async function deleteVoiceTrainingRecord(id: string) {
  try {
    const user = await getRequiredUser();
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!id || !id.trim()) {
      return { error: "Record ID is required." };
    }

    const whereClause = isAdmin
      ? eq(voiceTraining.id, id)
      : and(eq(voiceTraining.id, id), eq(voiceTraining.userId, user.id));

    const [deleted] = await db
      .delete(voiceTraining)
      .where(whereClause)
      .returning({ id: voiceTraining.id });

    if (!deleted) {
      return { error: "Record not found or you are not authorized to delete it." };
    }

    revalidatePath("/voice-training");
    return { success: true };
  } catch (err: unknown) {
    console.error("Error deleting voice training record:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete voice training record.";
    return { error: msg };
  }
}

/**
 * Permanently deletes ALL voice training records across all users.
 * Super Admin (admin@gmail.com) ONLY can perform this global operation.
 * SECURITY: Enforced strictly server-side.
 */
export async function deleteAllVoiceTrainingRecords() {
  try {
    const user = await getRequiredUser();
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!isAdmin) {
      return { error: "403 Forbidden: Only Super Admin can delete all voice training records." };
    }

    const deletedRows = await db
      .delete(voiceTraining)
      .returning({ id: voiceTraining.id });

    revalidatePath("/voice-training");
    return { success: true, deletedCount: deletedRows.length };
  } catch (err: unknown) {
    console.error("Error deleting all voice training records:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete voice training records.";
    return { error: msg };
  }
}
