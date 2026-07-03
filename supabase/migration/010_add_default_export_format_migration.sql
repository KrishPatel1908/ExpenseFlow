-- supabase/migration/010_add_default_export_format_migration.sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_export_format TEXT NOT NULL DEFAULT 'pdf';
