/**
 * Extracts numeric transaction amount from transcript (e.g., 500, 1500, 25,000, ₹500, 5k).
 * Returns numeric value or null.
 */
export function extractAmount(transcript: string): number | null {
  if (!transcript || !transcript.trim()) return null;

  const normalized = transcript.trim();

  // Pattern 1: Handle "k" suffix like 5k, 2.5k, ₹10k
  const kMatch = normalized.match(/(?:₹|rs\.?|rupees|રૂ\.?|રૂપિયા)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch && kMatch[1]) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (!isNaN(val) && val > 0) return val;
  }

  // Pattern 2: Explicit currency formatted amount (e.g. ₹500, 500 rupees, Rs. 1,500, 25,000)
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
      return parsed;
    }
  }

  return null;
}
