-- supabase/migration/002_add_expense_type.sql
-- Adds type check column (credit/debit) to the expenses table.

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'credit' 
CHECK (type IN ('credit', 'debit'));
