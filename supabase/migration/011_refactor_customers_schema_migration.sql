-- supabase/migration/011_refactor_customers_schema_migration.sql

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS nickname TEXT,
    ALTER COLUMN phone DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop unique constraint on (user_id, phone) since phone is now optional
ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS customers_user_id_phone_unique;
