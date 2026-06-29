-- supabase/user_preferences.sql
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_landing_page TEXT NOT NULL DEFAULT '/dashboard'
);
