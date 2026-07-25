import type { ParsedTransaction, ParseOptions, ConfidenceLevel, TransactionType } from "./types";
import { extractCustomer, SELF_CUSTOMER } from "./customers";
import { extractAmount } from "./amount";
import { extractTransactionType } from "./transaction";
import { extractCategory } from "./categories";
import { extractDate } from "./dates";
import { STOP_WORDS, DEBIT_KEYWORDS, CREDIT_KEYWORDS } from "./keywords";
import { isSelfWord } from "./pronouns";

/**
 * Normalizes input text into a clean working format.
 * - Lowercase
 * - Removes commas inside numbers (e.g. 10,000 -> 10000)
 * - Standardizes common verb forms (spend -> spent, pay -> paid, etc.)
 * - Cleans trailing punctuation
 */
export function normalizeTranscript(input: string): string {
  if (!input) return "";
  let text = input.trim().toLowerCase();

  // 1. Remove commas inside numbers (e.g. 10,000 -> 10000)
  text = text.replace(/(\d+),(\d+)/g, "$1$2");

  // 2. Standardize common verbs
  text = text
    .replace(/\bspend\b/g, "spent")
    .replace(/\bpay\b/g, "paid")
    .replace(/\bgive\b/g, "gave")
    .replace(/\breceive\b/g, "received")
    .replace(/\bget\b/g, "got");

  // 3. Clean trailing punctuation
  text = text.replace(/[.,!?]+$/g, "").trim();

  return text;
}

/**
 * Safely removes a substring from working text and cleans up double spaces.
 */
export function removeSubstring(text: string, sub: string): string {
  if (!text || !sub) return text;
  const escaped = sub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), " ").replace(/\s+/g, " ").trim();
}

/**
 * Filters out dates, amounts, customers, verbs, and stopwords to leave remaining text for description.
 */
export function extractDescription(
  workingText: string,
  rawTranscript: string
): string {
  if (!workingText || !workingText.trim()) return rawTranscript;

  const words = workingText.split(/\s+/);
  const filtered = words.filter((word) => {
    const clean = word.toLowerCase().replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, "");
    if (!clean) return false;

    // Filter out stopwords
    if ((STOP_WORDS as readonly string[]).includes(clean)) return false;

    // Filter out self words
    if (isSelfWord(clean)) return false;

    // Filter out action verbs
    const actionVerbs = [
      ...DEBIT_KEYWORDS,
      ...CREDIT_KEYWORDS,
      "spent", "spend", "paid", "pay", "gave", "give", "sent", "send",
      "transferred", "transfer", "purchased", "purchase", "bought", "buy",
      "received", "receive", "got", "get", "earned", "refund"
    ];
    if (actionVerbs.some((v) => v.toLowerCase() === clean)) return false;

    return true;
  });

  const result = filtered.join(" ").trim();
  return result || rawTranscript;
}

/**
 * Sequential Entity Extraction Pipeline (Parser V3).
 */
export function parseTransaction(
  transcript: string,
  options: ParseOptions = {}
): ParsedTransaction {
  const rawTranscript = transcript.trim();
  if (!rawTranscript) {
    return {
      transcript: "",
      customer: null,
      amount: null,
      transactionType: null,
      category: null,
      description: null,
      date: null,
      confidence: "low",
    };
  }

  // Step 0: Normalization
  let workingText = normalizeTranscript(rawTranscript);

  let customer: string | null = null;
  let category: string | null = null;
  let transactionType: TransactionType | null = null;

  // Check Adaptive Learning Dictionary rules first
  if (options.learningRules && options.learningRules.length > 0) {
    for (const rule of options.learningRules) {
      if (rule.phrase && workingText.includes(rule.phrase.toLowerCase())) {
        if (rule.detectedField === "customer" && !customer) {
          customer = rule.correctedValue;
        } else if (rule.detectedField === "category" && !category) {
          category = rule.correctedValue;
        } else if (
          rule.detectedField === "transactionType" &&
          !transactionType &&
          (rule.correctedValue === "credit" || rule.correctedValue === "debit")
        ) {
          transactionType = rule.correctedValue as TransactionType;
        }
      }
    }
  }

  // Step 1: Extract Date & Remove Date Text
  const dateResult = extractDate(workingText);
  const date = dateResult.date;
  if (dateResult.matchedText) {
    workingText = removeSubstring(workingText, dateResult.matchedText);
  }

  // Step 2: Extract Amount & Remove Amount Text
  const amountResult = extractAmount(workingText);
  const amount = amountResult.amount;
  if (amountResult.matchedText) {
    workingText = removeSubstring(workingText, amountResult.matchedText);
  }

  // Step 3: Extract Transaction Type
  if (!transactionType) {
    transactionType = extractTransactionType(workingText);
  }

  // Step 4: Extract Customer
  if (!customer) {
    customer = extractCustomer(workingText);
  }
  if (customer && customer !== SELF_CUSTOMER) {
    workingText = removeSubstring(workingText, customer);
  }

  // Step 5: Extract Category
  if (!category) {
    category = extractCategory(workingText, options.availableCategories);
  }

  // Step 6: Remaining Text -> Description
  const description = extractDescription(workingText, rawTranscript);

  // Confidence calculation
  let confidence: ConfidenceLevel = "low";
  if (customer && amount !== null && transactionType && date) {
    confidence = "high";
  } else if (customer && amount !== null) {
    confidence = "medium";
  }

  return {
    transcript: rawTranscript,
    customer,
    amount,
    transactionType,
    category,
    description,
    date,
    confidence,
  };
}
