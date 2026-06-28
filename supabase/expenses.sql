-- supabase/expenses.sql
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    category TEXT,
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT
);
