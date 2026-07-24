export const DEBIT_KEYWORDS = [
  "spent",
  "paid",
  "pay",
  "paying",
  "gave",
  "give",
  "purchase",
  "kharch",
  "ખર્ચ",
  "આપ્યા",
  "ચૂકવ્યા",
] as const;

export const CREDIT_KEYWORDS = [
  "received",
  "receive",
  "income",
  "salary",
  "earned",
  "got",
  "મળ્યા",
  "મળ્યો",
  "પગાર",
  "આવક",
] as const;

export const DATE_KEYWORDS = {
  today: ["today", "આજે"],
  tomorrow: ["tomorrow", "કાલે"],
  yesterday: ["yesterday", "ગઈકાલે"],
} as const;

export const DEFAULT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Petrol: ["petrol", "fuel", "પેટ્રોલ", "ઈંધણ"],
  Grocery: ["grocery", "groceries", "કરિયાણું", "શાકભાજી"],
  Food: ["food", "restaurant", "dinner", "lunch", "ખાનપાન", "જમવાનું"],
  Medicine: ["medicine", "medical", "pharmacy", "દવા", "દવાઓ"],
  Shopping: ["shopping", "clothes", "ખરીદી"],
  Salary: ["salary", "stipend", "પગાર"],
  Rent: ["rent", "ભાડું"],
};
