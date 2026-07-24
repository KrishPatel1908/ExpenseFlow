-- Migration 014: Add user_email column to voice_training table
ALTER TABLE voice_training ADD COLUMN IF NOT EXISTS user_email TEXT;
CREATE INDEX IF NOT EXISTS voice_training_user_email_idx ON voice_training(user_email);
