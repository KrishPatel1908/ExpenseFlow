import { DATE_KEYWORDS } from "./keywords";

const GUJARATI_DIGITS: Record<string, string> = {
  "૦": "0",
  "૧": "1",
  "૨": "2",
  "૩": "3",
  "૪": "4",
  "૫": "5",
  "૬": "6",
  "૭": "7",
  "૮": "8",
  "૯": "9",
};

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  જાન્યુઆરી: 0,
  feb: 1,
  february: 1,
  ફેબ્રુઆરી: 1,
  mar: 2,
  march: 2,
  માર્ચ: 2,
  apr: 3,
  april: 3,
  એપ્રિલ: 3,
  may: 4,
  મે: 4,
  jun: 5,
  june: 5,
  જૂન: 5,
  jul: 6,
  july: 6,
  જુલાઈ: 6,
  aug: 7,
  august: 7,
  ઓગસ્ટ: 7,
  sep: 8,
  september: 8,
  સપ્ટેમ્બર: 8,
  oct: 9,
  october: 9,
  ઓક્ટોબર: 9,
  nov: 10,
  november: 10,
  નવેમ્બર: 10,
  dec: 11,
  december: 11,
  ડિસેમ્બર: 11,
};

function normalizeGujaratiDigits(str: string): string {
  return str.replace(/[૦-૯]/g, (w) => GUJARATI_DIGITS[w] || w);
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface ExtractDateResult {
  date: string | null;
  matchedText: string | null;
}

/**
 * Parses relative date keywords (today, tomorrow, yesterday, આજે, કાલે, ગઈકાલે)
 * as well as absolute dates in English & Gujarati (e.g., "10th November 2025", "5 July", "July 5", "05/07", "૫ જુલાઈ").
 *
 * Returns object containing parsed date (YYYY-MM-DD) and the matched substring to remove.
 */
export function extractDate(transcript: string): ExtractDateResult {
  if (!transcript || !transcript.trim()) {
    return { date: null, matchedText: null };
  }

  const rawLower = transcript.toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();

  // 1. Check relative date keywords first
  for (const kw of DATE_KEYWORDS.today) {
    if (rawLower.includes(kw.toLowerCase())) {
      return { date: formatDateISO(now), matchedText: kw };
    }
  }

  for (const kw of DATE_KEYWORDS.yesterday) {
    if (rawLower.includes(kw.toLowerCase())) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { date: formatDateISO(yesterday), matchedText: kw };
    }
  }

  for (const kw of DATE_KEYWORDS.tomorrow) {
    if (rawLower.includes(kw.toLowerCase())) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return { date: formatDateISO(tomorrow), matchedText: kw };
    }
  }

  // Normalize Gujarati numerals to English digits for regex parsing
  const text = normalizeGujaratiDigits(rawLower);

  // Month names regex pattern
  const monthPattern =
    "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|જાન્યુઆરી|ફેબ્રુઆરી|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઈ|ઓગસ્ટ|સપ્ટેમ્બર|ઓક્ટોબર|નવેમ્બર|ડિસેમ્બર)";

  // Pattern A: "10th November 2025", "5 July", "5th July", "5 July 2026", "૫ જુલાઈ", "૫મી જુલાઈ"
  const dayFirstRegex = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th|મી|લી|જી|થી)?\\s+(${monthPattern})(?:\\s+(\\d{4}))?\\b`,
    "i"
  );
  const dayFirstMatch = text.match(dayFirstRegex);
  if (dayFirstMatch) {
    const day = parseInt(dayFirstMatch[1], 10);
    const monthKey = dayFirstMatch[2].toLowerCase();
    const year = dayFirstMatch[3] ? parseInt(dayFirstMatch[3], 10) : currentYear;

    if (MONTH_MAP[monthKey] !== undefined && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, MONTH_MAP[monthKey], day);
      if (!isNaN(parsedDate.getTime())) {
        return {
          date: formatDateISO(parsedDate),
          matchedText: dayFirstMatch[0],
        };
      }
    }
  }

  // Pattern B: "July 5", "July 5th 2026", "November 10th 2025"
  const monthFirstRegex = new RegExp(
    `\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th|મી|લી|જી|થી)?(?:\\s+(\\d{4}))?\\b`,
    "i"
  );
  const monthFirstMatch = text.match(monthFirstRegex);
  if (monthFirstMatch) {
    const monthKey = monthFirstMatch[1].toLowerCase();
    const day = parseInt(monthFirstMatch[2], 10);
    const year = monthFirstMatch[3] ? parseInt(monthFirstMatch[3], 10) : currentYear;

    if (MONTH_MAP[monthKey] !== undefined && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, MONTH_MAP[monthKey], day);
      if (!isNaN(parsedDate.getTime())) {
        return {
          date: formatDateISO(parsedDate),
          matchedText: monthFirstMatch[0],
        };
      }
    }
  }

  // Pattern C: Numeric date format e.g., "05/07", "5/7", "05-07", "05/07/2026", "૫/૭"
  const numericDateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?\b/);
  if (numericDateMatch) {
    const day = parseInt(numericDateMatch[1], 10);
    const month = parseInt(numericDateMatch[2], 10) - 1; // 0-indexed
    const year = numericDateMatch[3] ? parseInt(numericDateMatch[3], 10) : currentYear;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return {
          date: formatDateISO(parsedDate),
          matchedText: numericDateMatch[0],
        };
      }
    }
  }

  return { date: null, matchedText: null };
}
