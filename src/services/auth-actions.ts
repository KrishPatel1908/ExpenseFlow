"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { revalidatePath } from "next/cache";

export async function login(data: LoginInput) {
  try {
    const validated = loginSchema.parse(data);
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return { error: error.message };
    }

    // Clear caches and redirect
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to authenticate" };
  }
}

export async function logout() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    
    // Clear caches and redirect
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to log out" };
  }
}
