-- supabase/migration/008_add_net_balance_to_expenses_migration.sql

-- 1. Add net_balance column
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS net_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- 2. Populate existing rows: net_balance = credit - debit
UPDATE expenses SET net_balance = credit - debit;
