import {
  VOICE_TRANSACTION_SYSTEM_PROMPT,
  buildVoiceTransactionUserPrompt,
} from "./prompts/voiceTransaction";

export interface ParseVoiceTranscriptResult {
  success: boolean;
  data?: {
    customer: string;
    amount: number;
    transactionType: "credit" | "debit";
    category: string;
    description: string;
    date: string;
  };
  reason?: string | null;
}

/**
 * Call Gemini 2.5 Flash REST API server-side to extract structured transaction JSON from transcript.
 * Includes 15s timeout, dev-only logging, and robust JSON parsing error handling.
 */
export async function parseVoiceTranscriptWithGemini(
  transcript: string
): Promise<ParseVoiceTranscriptResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Gemini AI] Missing GEMINI_API_KEY environment variable.");
    }
    return {
      success: false,
      reason: "Server error: GEMINI_API_KEY environment variable is not configured.",
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 15 Second AbortController Timeout to handle network stalls or API timeouts gracefully
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[Gemini AI] Sending transcript to Gemini 2.5 Flash:", transcript);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: VOICE_TRANSACTION_SYSTEM_PROMPT },
              { text: buildVoiceTransactionUserPrompt(transcript) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      if (process.env.NODE_ENV === "development") {
        console.error(`[Gemini AI] HTTP Error ${response.status}:`, errorText);
      }
      return {
        success: false,
        reason: `Gemini API error (Status ${response.status}). Please try again.`,
      };
    }

    const resJson = await response.json();
    const rawContent =
      resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawContent) {
      return {
        success: false,
        reason: "Received an empty response from Gemini AI service.",
      };
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Gemini AI] Raw AI Response Text:", rawContent);
    }

    // Clean potential markdown fencing if present despite json mime type
    const cleanedText = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: ParseVoiceTranscriptResult;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return {
        success: false,
        reason: "Failed to parse structured JSON from Gemini response.",
      };
    }

    if (parsed.success && parsed.data) {
      return {
        success: true,
        data: {
          customer: parsed.data.customer || "",
          amount: Number(parsed.data.amount) || 0,
          transactionType:
            parsed.data.transactionType === "credit" ? "credit" : "debit",
          category: parsed.data.category || "",
          description: parsed.data.description || "",
          date: parsed.data.date || "today",
        },
        reason: null,
      };
    }

    return {
      success: false,
      reason: parsed.reason || "Could not parse valid transaction details from voice input.",
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    let message = "Failed to communicate with Gemini AI service.";

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        message = "Gemini API request timed out after 15 seconds. Please try again.";
      } else {
        message = err.message;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[Gemini AI] Exception occurred:", err);
    }

    return {
      success: false,
      reason: message,
    };
  }
}
