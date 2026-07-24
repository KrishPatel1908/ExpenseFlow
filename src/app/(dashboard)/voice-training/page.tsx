import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/constants";
import { VoiceTrainingClientView } from "@/features/voice-training/components/VoiceTrainingClientView";

export default async function VoiceTrainingRoutePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strict server-side authorization check: Only admin@gmail.com is allowed
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/dashboard");
  }

  return <VoiceTrainingClientView />;
}
