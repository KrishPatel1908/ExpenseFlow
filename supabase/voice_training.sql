-- Table: voice_training
-- Description: Stores rule-based voice parser output and user-confirmed values for NLP voice model training data.

CREATE TABLE IF NOT EXISTS voice_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  transcript TEXT NOT NULL,
  parsed_customer TEXT,
  parsed_amount NUMERIC(12, 2),
  parsed_transaction_type TEXT,
  parsed_category TEXT,
  parsed_date TEXT,
  parsed_description TEXT,
  confidence TEXT NOT NULL,
  final_customer TEXT,
  final_amount NUMERIC(12, 2),
  final_transaction_type TEXT,
  final_category TEXT,
  final_date TEXT,
  final_description TEXT,
  is_corrected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_training_user_id_idx ON voice_training(user_id);
CREATE INDEX IF NOT EXISTS voice_training_user_email_idx ON voice_training(user_email);
CREATE INDEX IF NOT EXISTS voice_training_confidence_idx ON voice_training(confidence);
CREATE INDEX IF NOT EXISTS voice_training_is_corrected_idx ON voice_training(is_corrected);
