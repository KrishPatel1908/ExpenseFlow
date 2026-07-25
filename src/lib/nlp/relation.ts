export const TO_WORDS = [
  "to",
  "for",
  "towards",

  "ને",
  "માટે",
] as const;

export const FROM_WORDS = [
  "from",

  "થી",
  "પાસેથી",
] as const;

export type ToWord = (typeof TO_WORDS)[number];
export type FromWord = (typeof FROM_WORDS)[number];

const TO_WORDS_SET = new Set<string>(TO_WORDS.map((w) => w.toLowerCase()));
const FROM_WORDS_SET = new Set<string>(FROM_WORDS.map((w) => w.toLowerCase()));

/**
 * Checks if a word is a TO relation word (English or Gujarati).
 */
export function isToWord(word: string): boolean {
  if (!word) return false;
  return TO_WORDS_SET.has(word.trim().toLowerCase());
}

/**
 * Checks if a word is a FROM relation word (English or Gujarati).
 */
export function isFromWord(word: string): boolean {
  if (!word) return false;
  return FROM_WORDS_SET.has(word.trim().toLowerCase());
}

/**
 * Checks if a word is a relation word (TO or FROM).
 */
export function isRelationWord(word: string): boolean {
  return isToWord(word) || isFromWord(word);
}