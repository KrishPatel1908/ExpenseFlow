"use server";

import { db } from "@db/index";
import { voiceLearningDictionary } from "@db/schema";
import { eq, and } from "drizzle-orm";

export interface LearningCorrectionInput {
  phrase: string;
  detectedField: "customer" | "category" | "transactionType";
  correctedValue: string;
  language?: string;
}

export interface LearningRuleItem {
  phrase: string;
  detectedField: string;
  correctedValue: string;
  language: string;
}

/**
 * Records or increments adaptive learning dictionary rules when an admin/user corrects a field.
 */
export async function saveLearningCorrection(input: LearningCorrectionInput) {
  try {
    const phrase = input.phrase.trim().toLowerCase();
    const correctedValue = input.correctedValue.trim();
    const detectedField = input.detectedField;
    const language = input.language || "en-IN";

    if (!phrase || !correctedValue) return { success: false };

    // Check if matching learning rule exists
    const [existing] = await db
      .select({
        id: voiceLearningDictionary.id,
        usageCount: voiceLearningDictionary.usageCount,
      })
      .from(voiceLearningDictionary)
      .where(
        and(
          eq(voiceLearningDictionary.phrase, phrase),
          eq(voiceLearningDictionary.detectedField, detectedField),
          eq(voiceLearningDictionary.correctedValue, correctedValue),
          eq(voiceLearningDictionary.language, language)
        )
      );

    if (existing) {
      await db
        .update(voiceLearningDictionary)
        .set({
          usageCount: existing.usageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(voiceLearningDictionary.id, existing.id));
    } else {
      await db.insert(voiceLearningDictionary).values({
        phrase,
        detectedField,
        correctedValue,
        language,
        usageCount: 1,
        approved: true,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Error saving voice learning correction:", err);
    return { success: false, error: "Failed to save learning rule" };
  }
}

/**
 * Returns all approved learning dictionary rules to boost NLP parsing accuracy.
 */
export async function getApprovedLearningRules(language: string = "en-IN"): Promise<LearningRuleItem[]> {
  try {
    const rules = await db
      .select({
        phrase: voiceLearningDictionary.phrase,
        detectedField: voiceLearningDictionary.detectedField,
        correctedValue: voiceLearningDictionary.correctedValue,
        language: voiceLearningDictionary.language,
      })
      .from(voiceLearningDictionary)
      .where(
        and(
          eq(voiceLearningDictionary.approved, true),
          eq(voiceLearningDictionary.language, language)
        )
      );

    return rules;
  } catch (err: unknown) {
    console.error("Error loading voice learning rules:", err);
    return [];
  }
}
