export interface ExtractAmountResult {
  amount: number | null;
  matchedText: string | null;
}

/**
 * Extracts numeric transaction amount from transcript (e.g., 500, 1500, 10000, 10000 rupees, ₹500, 5k).
 * Returns object containing numeric amount and matched string for working transcript removal.
 */
export function extractAmount(transcript: string): ExtractAmountResult {
  if (!transcript || !transcript.trim()) {
    return { amount: null, matchedText: null };
  }

  const normalized = transcript.trim();

  // Pattern 1: Handle "k" suffix like 5k, 2.5k, ₹10k, 10k rupees
  const kMatch = normalized.match(/(?:₹|rs\.?|rupees|રૂ\.?|રૂપિયા)?\s*(\d+(?:\.\d+)?)\s*k\b(?:\s*(?:rupees|rs|રૂપિયા))?/i);
  if (kMatch && kMatch[1]) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (!isNaN(val) && val > 0) {
      return {
        amount: val,
        matchedText: kMatch[0],
      };
    }
  }

  // Pattern 2: Explicit currency formatted amount with optional currency suffix/prefix (e.g. ₹500, 10000 rupees, Rs. 1500, 25000)
  const matches = Array.from(
    normalized.matchAll(/(?:₹|rs\.?|rupees|રૂ\.?|રૂપિયા)?\s*([0-9]{1,3}(?:,[0-9]{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:\/-|rupees|rs|રૂપિયા)?/gi)
  );

  for (const match of matches) {
    const rawIntPart = match[1];
    if (!rawIntPart) continue;

    const cleanInt = rawIntPart.replace(/,/g, "");
    const decimalPart = match[2] ? `.${match[2]}` : "";
    const parsed = parseFloat(`${cleanInt}${decimalPart}`);

    if (!isNaN(parsed) && parsed > 0) {
      return {
        amount: parsed,
        matchedText: match[0],
      };
    }
  }

  return { amount: null, matchedText: null };
}
