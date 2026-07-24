import type { TransactionType } from "./types";
import { DEBIT_KEYWORDS, CREDIT_KEYWORDS } from "./keywords";

/**
 * Determines transaction type ("credit" | "debit" | null) based on keywords.
 */
export function extractTransactionType(transcript: string): TransactionType | null {
  if (!transcript || !transcript.trim()) return null;

  const lower = transcript.toLowerCase();

  const hasDebit = DEBIT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  const hasCredit = CREDIT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));

  if (hasDebit && !hasCredit) return "debit";
  if (hasCredit && !hasDebit) return "credit";

  if (hasDebit && hasCredit) {
    let firstDebitPos = Infinity;
    for (const kw of DEBIT_KEYWORDS) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < firstDebitPos) firstDebitPos = idx;
    }

    let firstCreditPos = Infinity;
    for (const kw of CREDIT_KEYWORDS) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < firstCreditPos) firstCreditPos = idx;
    }

    return firstDebitPos < firstCreditPos ? "debit" : "credit";
  }

  return null;
}
