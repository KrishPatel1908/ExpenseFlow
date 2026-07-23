-- supabase/migration/012_add_updated_at_to_expenses_migration.sql

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
