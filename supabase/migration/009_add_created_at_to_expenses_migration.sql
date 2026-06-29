-- supabase/migration/009_add_created_at_to_expenses_migration.sql
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
