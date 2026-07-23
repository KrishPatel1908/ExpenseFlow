import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseVoiceTranscriptWithGemini } from "@/ai/gemini";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Request validation schema
const voiceRequestSchema = z.object({
  transcript: z.string().trim().min(1, "Speech transcript is required and cannot be empty."),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Admin User
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, reason: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Body
    const body = await req.json().catch(() => ({}));
    const parseResult = voiceRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message || "Invalid request body.";
      return NextResponse.json(
        { success: false, reason: errorMessage },
        { status: 400 }
      );
    }

    const { transcript } = parseResult.data;

    // 3. Call Gemini 2.5 Flash Service (Server-side)
    const aiResponse = await parseVoiceTranscriptWithGemini(transcript);

    if (!aiResponse.success || !aiResponse.data) {
      return NextResponse.json(
        {
          success: false,
          reason: aiResponse.reason || "Failed to process voice transcript.",
        },
        { status: 400 }
      );
    }

    // 4. Return structured JSON (without DB side-effects or customer lookup at this stage)
    return NextResponse.json({
      success: true,
      data: aiResponse.data,
      reason: null,
    });
  } catch (err: unknown) {
    console.error("API /api/voice error:", err);
    const message = err instanceof Error ? err.message : "Internal server error occurred.";
    return NextResponse.json(
      { success: false, reason: message },
      { status: 500 }
    );
  }
}
