-- Drop old expenses table with its data
DROP TABLE IF EXISTS expenses CASCADE;

-- Create new expenses table with exactly the requested columns
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    category TEXT,
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT
);

-- Create indexes for performance
CREATE INDEX expenses_customer_name_idx ON expenses(customer_name);
CREATE INDEX expenses_date_idx ON expenses(date);
