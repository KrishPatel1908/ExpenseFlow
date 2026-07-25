import { isSelfWord } from "./pronouns";
import { isToWord, isFromWord, isRelationWord } from "./relation";
import { DEBIT_KEYWORDS, CREDIT_KEYWORDS, DATE_KEYWORDS, DEFAULT_CATEGORY_KEYWORDS } from "./keywords";

/**
 * Constant representing the logged-in user / speaker as the transaction customer.
 */
export const SELF_CUSTOMER = "SELF";

export type Actor = "SELF" | "OTHER";

interface ProcessedToken {
  raw: string;
  clean: string;
  cleanLower: string;
  index: number;
  stem?: string;
  hasNeSuffix?: boolean;
  hasThiSuffix?: boolean;
  hasESuffix?: boolean;
}

const RESERVED_STOPWORDS = new Set<string>([
  "the",
  "and",
  "a",
  "an",
  "in",
  "on",
  "at",
  "by",
  "of",
  "is",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "will",
  "am",
  "on",
  "get",
  "got",
  "rupees",
  "rs",
  "રૂપિયા",
  "રૂ",
]);

/**
 * Strips non-alphanumeric punctuation from the ends of a candidate string.
 */
export function cleanCandidateName(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, "").trim();
}

/**
 * Checks if a string contains numbers or currency terms.
 */
function isNumericOrCurrency(str: string): boolean {
  if (!str) return true;
  const clean = str.toLowerCase().trim();
  if (!clean) return true;
  if (/^\d+(\.\d+)?$/.test(clean)) return true;
  if (/^\d+(st|nd|rd|th|મી|લી|જી|થી)$/i.test(clean)) return true;
  if (/^[૦-૯]+$/.test(clean)) return true;
  return clean === "rupees" || clean === "rs" || clean === "રૂપિયા" || clean === "રૂ" || clean === "₹";
}

/**
 * Checks if a string is a known date or category keyword.
 */
function isDateOrCategoryWord(strLower: string): boolean {
  if (!strLower) return false;

  // Date relative keywords
  if (
    DATE_KEYWORDS.today.some((k) => k.toLowerCase() === strLower) ||
    DATE_KEYWORDS.tomorrow.some((k) => k.toLowerCase() === strLower) ||
    DATE_KEYWORDS.yesterday.some((k) => k.toLowerCase() === strLower)
  ) {
    return true;
  }

  // Common month names
  const monthNames = [
    "january", "jan", "february", "feb", "march", "mar", "april", "apr",
    "may", "june", "jun", "july", "jul", "august", "aug", "september", "sep",
    "october", "oct", "november", "nov", "december", "dec",
    "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ",
    "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
  ];
  if (monthNames.includes(strLower)) return true;

  // Category synonyms
  for (const keywords of Object.values(DEFAULT_CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => kw.toLowerCase() === strLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a string is a known debit or credit action verb.
 */
function isActionVerb(strLower: string): boolean {
  if (!strLower) return false;
  const actionList = [
    ...DEBIT_KEYWORDS,
    ...CREDIT_KEYWORDS,
    "paid", "pay", "spent", "spend", "gave", "give", "sent", "send",
    "transferred", "transfer", "purchased", "purchase", "bought", "buy",
    "lent", "borrowed", "ordered", "invested", "donated", "received", "receive",
    "got", "get", "earned", "refund", "returned", "credited", "deposit", "cashback",
    "ખર્ચ", "ખર્ચ્યું", "ખર્ચ કર્યા", "ખર્ચ કર્યો", "કર્યા", "કર્યો", "કર્યું", "કરવું",
    "આપ્યા", "આપ્યો", "આપી", "આપ્યું", "મોકલ્યા", "મોકલ્યો", "મોકલ્યું",
    "લીધા", "લીધો", "લીધી", "લીધું", "ચૂકવ્યા", "મળ્યા", "મળ્યો", "મળ્યું", "ખરીદ્યું"
  ];
  return actionList.some((verb) => verb.toLowerCase() === strLower);
}

/**
 * Checks if a candidate word should be ignored as a customer name.
 * Returns true if word is a SELF word, relation word, number, category, date, action verb, or stopword.
 */
export function isCandidateIgnored(candidate: string): boolean {
  if (!candidate) return true;
  const clean = cleanCandidateName(candidate);
  if (!clean || clean.length < 2) return true;

  const lower = clean.toLowerCase();

  // Rule: SELF words must NEVER be returned as customer names
  if (isSelfWord(lower)) return true;

  // Relation words
  if (isRelationWord(lower)) return true;

  // Numeric / Currency
  if (isNumericOrCurrency(lower)) return true;

  // Date / Category
  if (isDateOrCategoryWord(lower)) return true;

  // Action verbs
  if (isActionVerb(lower)) return true;

  // Stopwords
  if (RESERVED_STOPWORDS.has(lower)) return true;

  return false;
}

/**
 * Tokenizes transcript and identifies Gujarati postposition suffixes.
 */
export function tokenizeTranscript(transcript: string): ProcessedToken[] {
  if (!transcript || !transcript.trim()) return [];

  const rawTokens = transcript.trim().split(/\s+/);
  return rawTokens.map((raw, index) => {
    const clean = cleanCandidateName(raw);
    const cleanLower = clean.toLowerCase();
    const token: ProcessedToken = { raw, clean, cleanLower, index };

    // Check Gujarati relation suffixes attached directly to words (e.g. "રાહુલને", "રાહુલે", "રાહુલથી")
    // Only strip suffix if token itself is NOT a date, self word, verb, stopword or relation word
    if (
      clean.length > 2 &&
      !isRelationWord(cleanLower) &&
      !isDateOrCategoryWord(cleanLower) &&
      !isSelfWord(cleanLower) &&
      !isActionVerb(cleanLower) &&
      !RESERVED_STOPWORDS.has(cleanLower)
    ) {
      if (clean.endsWith("ને")) {
        token.stem = clean.slice(0, -2);
        token.hasNeSuffix = true;
      } else if (clean.endsWith("થી")) {
        token.stem = clean.slice(0, -2);
        token.hasThiSuffix = true;
      } else if (clean.endsWith("એ") || clean.endsWith("ે")) {
        token.stem = clean.slice(0, -1);
        token.hasESuffix = true;
      }
    }

    return token;
  });
}

/**
 * Extracts customer candidate based on TO / FROM relation words or postpositions.
 */
export function extractByRelation(tokens: ProcessedToken[]): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Gujarati attached suffixes (e.g. "રાહુલને", "રાહુલે", "રાહુલથી")
    if (token.hasNeSuffix && token.stem && !isCandidateIgnored(token.stem)) {
      return token.stem;
    }
    if (token.hasThiSuffix && token.stem && !isCandidateIgnored(token.stem)) {
      return token.stem;
    }
    if (token.hasESuffix && token.stem && !isCandidateIgnored(token.stem)) {
      return token.stem;
    }

    // Gujarati separate postposition "પાસેથી" or "થી" or "ને" or "માટે"
    if (token.cleanLower === "પાસેથી" || token.cleanLower === "થી" || token.cleanLower === "ને" || token.cleanLower === "માટે") {
      if (i > 0 && !isCandidateIgnored(tokens[i - 1].clean)) {
        return tokens[i - 1].clean;
      }
    }

    // English prepositions (e.g. "to Rutvik", "from Harshil", "for Rahul")
    if (isToWord(token.cleanLower) || isFromWord(token.cleanLower)) {
      if (i + 1 < tokens.length && !isCandidateIgnored(tokens[i + 1].clean)) {
        return tokens[i + 1].clean;
      }
    }
  }

  return null;
}

/**
 * Extracts customer candidate based on action verb position.
 */
export function extractByAction(tokens: ProcessedToken[]): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!isActionVerb(token.cleanLower)) continue;

    // Pattern 1: Verb + Customer (e.g. "paid Rahul 500", "lent Rahul 500", "gave Harshil 1000")
    if (i + 1 < tokens.length && !isCandidateIgnored(tokens[i + 1].clean)) {
      return tokens[i + 1].clean;
    }

    // Pattern 2: Customer + Verb + SELF_WORD (e.g. "Harshil gave me 1000", "Rahul transferred 500 to me")
    if (i > 0 && !isCandidateIgnored(tokens[i - 1].clean)) {
      return tokens[i - 1].clean;
    }

    // Pattern 3: Look for initial non-ignored candidate subject before verb (e.g. "Rahul transferred 500 to me")
    for (let j = 0; j < i; j++) {
      if (!isCandidateIgnored(tokens[j].clean)) {
        return tokens[j].clean;
      }
    }
  }

  return null;
}

/**
 * Fallback to search for any valid non-ignored token.
 */
export function extractFallbackCandidate(tokens: ProcessedToken[]): string | null {
  for (const token of tokens) {
    if (!isCandidateIgnored(token.clean)) {
      return token.clean;
    }
  }
  return null;
}

/**
 * Checks if the transcript belongs to the speaker / logged-in user.
 */
export function hasSelfContext(tokens: ProcessedToken[], transcript: string): boolean {
  if (!transcript || !transcript.trim()) return false;

  // Check if any token is a SELF word
  for (const token of tokens) {
    if (isSelfWord(token.cleanLower)) {
      return true;
    }
  }

  // Implicit speaker transactions (e.g. "Salary received today", "spent 500")
  const lower = transcript.toLowerCase();
  if (
    lower.includes("salary") ||
    lower.includes("પગાર") ||
    lower.includes("spent") ||
    lower.includes("ખર્ચ") ||
    lower.includes("received") ||
    lower.includes("મળ્યો") ||
    lower.includes("આપ્યા")
  ) {
    return true;
  }

  return false;
}

/**
 * Determines the primary actor performing or receiving the transaction.
 */
export function detectActor(tokens: ProcessedToken[]): Actor {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (isSelfWord(token.cleanLower)) {
      if (i === 0) return "SELF";
    }
  }
  return "OTHER";
}

/**
 * Extracts customer name based on rule-based extraction engine.
 *
 * Algorithm Priority:
 * 1. Tokenize & normalize transcript
 * 2. Relation extraction (TO / FROM / Gujarati postpositions)
 * 3. Action verb extraction (subject / object around verb)
 * 4. Candidate fallback
 * 5. If customer exists, return customer name (never a SELF word)
 * 6. If no explicit customer exists and transaction belongs to speaker, return SELF_CUSTOMER ("SELF")
 * 7. Return null otherwise
 */
export function extractCustomer(transcript: string): string | null {
  if (!transcript || !transcript.trim()) return null;

  const tokens = tokenizeTranscript(transcript);

  // Priority 1: Relation extraction
  const relationCandidate = extractByRelation(tokens);
  if (relationCandidate) return relationCandidate;

  // Priority 2: Action verb extraction
  const actionCandidate = extractByAction(tokens);
  if (actionCandidate) return actionCandidate;

  // Priority 3: Candidate fallback
  const fallbackCandidate = extractFallbackCandidate(tokens);
  if (fallbackCandidate) return fallbackCandidate;

  // Priority 4: Return SELF_CUSTOMER if transaction belongs to speaker
  if (hasSelfContext(tokens, transcript)) {
    return SELF_CUSTOMER;
  }

  return null;
}

