-- supabase/expenses.sql
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category TEXT,
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
