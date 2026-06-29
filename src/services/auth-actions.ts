"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@db/index";
import { userPreferences } from "@db/schema";
import { eq } from "drizzle-orm";

// In-memory rate limiting map (IP/Email -> { count, resetTime })
const limitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(key: string): { limited: boolean; timeLeftMinutes?: number } {
  const now = Date.now();
  const record = limitMap.get(key);

  if (!record) return { limited: false };

  // If window expired, reset limit
  if (now > record.resetTime) {
    limitMap.delete(key);
    return { limited: false };
  }

  if (record.count >= RATE_LIMIT_ATTEMPTS) {
    const timeLeftMinutes = Math.ceil((record.resetTime - now) / 1000 / 60);
    return { limited: true, timeLeftMinutes };
  }

  return { limited: false };
}

function recordAttempt(key: string, success: boolean) {
  const now = Date.now();
  const record = limitMap.get(key);

  if (success) {
    limitMap.delete(key);
    return;
  }

  if (!record) {
    limitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

export async function login(data: LoginInput) {
  try {
    const validated = loginSchema.parse(data);
    const clientHeaders = await headers();
    
    // Get client IP for rate limiting
    const ip = clientHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const emailKey = `email:${validated.email.toLowerCase()}`;

    // 1. Rate Limit Checks
    const ipCheck = checkRateLimit(ip);
    if (ipCheck.limited) {
      return { error: `Too many login attempts from this IP. Please try again in ${ipCheck.timeLeftMinutes} minute(s).` };
    }

    const emailCheck = checkRateLimit(emailKey);
    if (emailCheck.limited) {
      return { error: `This account is temporarily locked. Please try again in ${emailCheck.timeLeftMinutes} minute(s).` };
    }

    // 2. Supabase JWT Authentication
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      // Record failed attempts
      recordAttempt(ip, false);
      recordAttempt(emailKey, false);
      
      // Return a generic security-hardened error message
      return { error: "Invalid email or password." };
    }

    // Reset rate limits on success
    recordAttempt(ip, true);
    recordAttempt(emailKey, true);

    // Clear caches and redirect
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Authentication failed. Please try again later." };
  }
}

export async function logout() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    
    // Clear caches and redirect
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log out";
    return { error: message };
  }
}

export async function getDefaultLandingPage() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return "/dashboard";

    const record = await db
      .select({ defaultLandingPage: userPreferences.defaultLandingPage })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    return record[0]?.defaultLandingPage ?? "/dashboard";
  } catch (error) {
    console.error("Failed to get default landing page:", error);
    return "/dashboard";
  }
}

export async function setDefaultLandingPage(page: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("Unauthorized access. Please sign in.");
    }

    await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        defaultLandingPage: page,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { defaultLandingPage: page },
      });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to set default landing page:", error);
    const message = error instanceof Error ? error.message : "Failed to update preference";
    return { error: message };
  }
}

export async function changePassword(newPassword: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "Unauthorized. Please sign in." };
    }

    if (newPassword.trim().length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update password:", error);
    const message = error instanceof Error ? error.message : "Failed to update password";
    return { error: message };
  }
}
