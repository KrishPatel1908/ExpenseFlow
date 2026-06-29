-- supabase/migration/007_add_user_preferences_migration.sql
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_landing_page TEXT NOT NULL DEFAULT '/dashboard'
);
