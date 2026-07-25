export const SELF_WORDS = [
  "i",
  "me",
  "my",
  "mine",
  "myself",

  "હું",
  "મેં",
  "મને",
  "મારું",
  "મારી",
  "મારો",
] as const;

export type SelfWord = (typeof SELF_WORDS)[number];

const SELF_WORDS_SET = new Set<string>(SELF_WORDS.map((w) => w.toLowerCase()));

/**
 * Checks if a word is a self pronoun (English or Gujarati).
 */
export function isSelfWord(word: string): boolean {
  if (!word) return false;
  return SELF_WORDS_SET.has(word.trim().toLowerCase());
}