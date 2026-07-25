-- Migration 015: Add voice_learning_dictionary table for adaptive NLP learning
CREATE TABLE IF NOT EXISTS voice_learning_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase TEXT NOT NULL,
  detected_field TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en-IN',
  usage_count INTEGER NOT NULL DEFAULT 1,
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_learning_phrase_idx ON voice_learning_dictionary(phrase);
CREATE INDEX IF NOT EXISTS voice_learning_field_idx ON voice_learning_dictionary(detected_field);
CREATE INDEX IF NOT EXISTS voice_learning_approved_idx ON voice_learning_dictionary(approved);
