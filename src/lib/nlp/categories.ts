import { DEFAULT_CATEGORY_KEYWORDS } from "./keywords";

/**
 * Matches spoken category against the provided list of available categories or default keyword dictionary.
 * Performs:
 * - Case-insensitive matching
 * - Whitespace trimming
 * - English matching
 * - Gujarati matching
 *
 * Returns matching category name or null if no match found.
 */
export function extractCategory(
  transcript: string,
  availableCategories: string[] = []
): string | null {
  if (!transcript || !transcript.trim()) return null;

  const normalized = transcript.trim().toLowerCase();

  // 1. Direct match against available categories (case-insensitive)
  if (availableCategories.length > 0) {
    for (const cat of availableCategories) {
      const catClean = cat.trim().toLowerCase();
      if (catClean && normalized.includes(catClean)) {
        return cat;
      }
    }
  }

  // 2. Keyword dictionary match (English & Gujarati synonyms)
  for (const [categoryName, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
    const hasMatch = keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    if (hasMatch) {
      // If category exists in availableCategories list, return the exact available category
      const matchedInAvailable = availableCategories.find(
        (cat) => cat.trim().toLowerCase() === categoryName.toLowerCase()
      );
      return matchedInAvailable || categoryName;
    }
  }

  return null;
}
