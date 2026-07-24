import type { ParsedTransaction, ParseOptions, ConfidenceLevel } from "./types";
import { extractCustomer } from "./customers";
import { extractAmount } from "./amount";
import { extractTransactionType } from "./transaction";
import { extractCategory } from "./categories";
import { extractDate } from "./dates";

/**
 * Rule-Based NLP Parser engine for voice transactions.
 * Extracts Customer, Amount, Transaction Type, Category, Date, and Description.
 *
 * Confidence calculation rules:
 * - HIGH: Customer + Amount + Transaction Type + Date found
 * - MEDIUM: Customer + Amount found
 * - LOW: Less than that
 */
export function parseTransaction(
  transcript: string,
  options: ParseOptions = {}
): ParsedTransaction {
  const normalizedTranscript = transcript.trim();
  const customer = extractCustomer(normalizedTranscript);
  const amount = extractAmount(normalizedTranscript);
  const transactionType = extractTransactionType(normalizedTranscript);
  const category = extractCategory(normalizedTranscript, options.availableCategories);
  const date = extractDate(normalizedTranscript);

  let confidence: ConfidenceLevel = "low";

  if (customer && amount !== null && transactionType && date) {
    confidence = "high";
  } else if (customer && amount !== null) {
    confidence = "medium";
  }

  return {
    transcript: normalizedTranscript,
    customer,
    amount,
    transactionType,
    category,
    description: normalizedTranscript || null,
    date,
    confidence,
  };
}
