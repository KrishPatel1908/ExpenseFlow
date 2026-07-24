const RESERVED_WORDS = new Set([
  "today",
  "tomorrow",
  "yesterday",
  "spent",
  "paid",
  "gave",
  "purchase",
  "received",
  "income",
  "salary",
  "earned",
  "got",
  "petrol",
  "fuel",
  "grocery",
  "groceries",
  "food",
  "medicine",
  "medical",
  "shopping",
  "rent",
  "rupees",
  "rs",
  "kharch",
  "આજે",
  "કાલે",
  "ગઈકાલે",
  "ખર્ચ",
  "આપ્યા",
  "ચૂકવ્યા",
  "મળ્યા",
  "પગાર",
  "આવક",
  "પેટ્રોલ",
  "ઈંધણ",
  "કરિયાણું",
  "દવા",
  "ખરીદી",
  "ભાડું",
  "રૂપિયા",
  "રૂ",
  "for",
  "the",
  "and",
  "a",
  "an",
  "in",
  "on",
  "at",
  "by",
  "of",
  "from",
  "to",
]);

function isReserved(word: string): boolean {
  if (!word) return true;
  const clean = word.toLowerCase().trim();
  if (!clean || clean.length < 2) return true;
  if (/^\d+$/.test(clean)) return true;
  return RESERVED_WORDS.has(clean);
}

function cleanName(raw: string): string {
  return raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
}

/**
 * Extracts customer name based on patterns like:
 * English: "Rahul paid", "Rahul spent", "paid Rahul", "from Rahul", "to Rahul"
 * Gujarati: "રાહુલને", "રાહુલ પાસેથી", "રાહુલે"
 *
 * Returns only the customer name or null.
 */
export function extractCustomer(transcript: string): string | null {
  if (!transcript || !transcript.trim()) return null;

  const text = transcript.trim();

  // Gujarati pattern 1: "રાહુલ પાસેથી" -> capture before પાસેથી
  const guPasetheeMatch = text.match(/([^\s]+)\s+પાસેથી/u);
  if (guPasetheeMatch && guPasetheeMatch[1]) {
    const candidate = cleanName(guPasetheeMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // Gujarati pattern 2: "રાહુલને" -> strip "ને"
  const guNeMatch = text.match(/([^\s]+)ને\b/u);
  if (guNeMatch && guNeMatch[1]) {
    const candidate = cleanName(guNeMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // Gujarati pattern 3: "રાહુલે" -> strip "એ" suffix if present
  const guEMatch = text.match(/([^\s]+)એ\b/u);
  if (guEMatch && guEMatch[1]) {
    const candidate = cleanName(guEMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // English pattern 1: Prepositions ("from Rahul", "to Rahul", "paid to Rahul", "received from Rahul")
  const prepMatch = text.match(/(?:from|to|paid\s+to|given\s+to|received\s+from)\s+([A-Z][a-z0-9_]*|[a-zA-Z0-9_]+)/i);
  if (prepMatch && prepMatch[1]) {
    const candidate = cleanName(prepMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // English pattern 2: Subject before action verb ("Rahul paid", "Rahul spent", "Rahul gave", "Rahul received", "Rahul will pay")
  const subjMatch = text.match(/([A-Z][a-z0-9_]*|[a-zA-Z0-9_]+)\s+(?:paid|pay|spent|gave|received|purchased|will\s+pay|will\s+give)/i);
  if (subjMatch && subjMatch[1]) {
    const candidate = cleanName(subjMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // English pattern 3: Action verb before customer ("paid Rahul", "gave Rahul", "pay Rahul")
  const verbMatch = text.match(/(?:paid|pay|gave|give|received|spent)\s+([A-Z][a-z0-9_]*|[a-zA-Z0-9_]+)/i);
  if (verbMatch && verbMatch[1]) {
    const candidate = cleanName(verbMatch[1]);
    if (!isReserved(candidate)) return candidate;
  }

  // Fallback: Check for capitalized tokens in English transcript
  const words = text.split(/\s+/);
  for (const w of words) {
    const cleaned = cleanName(w);
    // If capitalized word that isn't reserved
    if (/^[A-Z][a-z0-9_]+$/.test(cleaned) && !isReserved(cleaned)) {
      return cleaned;
    }
  }

  return null;
}
