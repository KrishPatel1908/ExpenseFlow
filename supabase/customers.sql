-- supabase/customers.sql
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    CONSTRAINT customers_user_id_phone_unique UNIQUE (user_id, phone)
);
