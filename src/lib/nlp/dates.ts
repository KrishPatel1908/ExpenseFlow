import { DATE_KEYWORDS } from "./keywords";

/**
 * Parses relative date keywords (today, tomorrow, yesterday, આજે, કાલે, ગઈકાલે)
 * into a standard YYYY-MM-DD ISO string.
 */
export function extractDate(transcript: string): string | null {
  if (!transcript || !transcript.trim()) return null;

  const lower = transcript.toLowerCase();
  const now = new Date();

  // Check today / આજે
  if (DATE_KEYWORDS.today.some((kw) => lower.includes(kw.toLowerCase()))) {
    return formatDateISO(now);
  }

  // Check yesterday / ગઈકાલે
  if (DATE_KEYWORDS.yesterday.some((kw) => lower.includes(kw.toLowerCase()))) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return formatDateISO(yesterday);
  }

  // Check tomorrow / કાલે
  if (DATE_KEYWORDS.tomorrow.some((kw) => lower.includes(kw.toLowerCase()))) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return formatDateISO(tomorrow);
  }

  return null;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
