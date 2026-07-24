export type NlpLanguageCode = "en-IN" | "gu-IN";

export type TransactionType = "credit" | "debit";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ParsedTransaction {
  transcript: string;
  customer: string | null;
  amount: number | null;
  transactionType: TransactionType | null;
  category: string | null;
  description: string | null;
  date: string | null;
  confidence: ConfidenceLevel;
}

export interface ParseOptions {
  language?: NlpLanguageCode;
  availableCategories?: string[];
}
