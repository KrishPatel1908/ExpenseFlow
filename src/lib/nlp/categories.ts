import { DEFAULT_CATEGORY_KEYWORDS } from "./keywords";

/**
 * Matches spoken category against the provided list of available categories or default keyword dictionary.
 * Priority:
 * 1. Direct match against available categories from database (case-insensitive, whitespace trimmed)
 * 2. Keyword synonym dictionary match
 * 3. Returns null if no match found (never auto-creates category)
 */
export function extractCategory(
  transcript: string,
  availableCategories: string[] = []
): string | null {
  if (!transcript || !transcript.trim()) return null;

  const normalized = transcript.trim().toLowerCase();

  // 1. First search ALL existing categories from database (sorted by length descending for best match)
  if (availableCategories.length > 0) {
    const sortedCategories = [...availableCategories].sort((a, b) => b.length - a.length);
    for (const cat of sortedCategories) {
      const catClean = cat.trim().toLowerCase();
      if (catClean && (normalized === catClean || normalized.includes(catClean))) {
        return cat;
      }
    }
  }

  // 2. Search the synonym dictionary (English & Gujarati synonyms)
  for (const [categoryName, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
    // Sort keywords by length descending so multi-word synonyms (e.g. "scooter petrol", "mobile recharge") match first
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const hasMatch = sortedKeywords.some((kw) => {
      const kwClean = kw.trim().toLowerCase();
      return kwClean && normalized.includes(kwClean);
    });

    if (hasMatch) {
      // If category exists in availableCategories list, return the exact available category case-sensitively
      const matchedInAvailable = availableCategories.find(
        (cat) => cat.trim().toLowerCase() === categoryName.toLowerCase()
      );
      return matchedInAvailable || categoryName;
    }
  }

  // 3. If no existing category matches and no synonym matches, return null
  return null;
}

