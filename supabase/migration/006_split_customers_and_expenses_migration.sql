-- supabase/migration/006_split_customers_and_expenses_migration.sql

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    CONSTRAINT customers_user_id_phone_unique UNIQUE (user_id, phone)
);

-- Create indexes on customers
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);

-- 2. Migrate existing unique customers from expenses to customers
INSERT INTO customers (user_id, name, phone)
SELECT DISTINCT user_id, customer_name, customer_phone
FROM expenses
ON CONFLICT (user_id, phone) DO NOTHING;

-- 3. Add customer_id to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- 4. Update customer_id in expenses by matching user_id, name, and phone
UPDATE expenses e
SET customer_id = c.id
FROM customers c
WHERE e.user_id = c.user_id 
  AND e.customer_name = c.name 
  AND e.customer_phone = c.phone;

-- 5. Make customer_id NOT NULL
ALTER TABLE expenses ALTER COLUMN customer_id SET NOT NULL;

-- 6. Drop old customer columns from expenses table
ALTER TABLE expenses DROP COLUMN IF EXISTS customer_name;
ALTER TABLE expenses DROP COLUMN IF EXISTS customer_phone;

-- 7. Create index on expenses.customer_id
CREATE INDEX IF NOT EXISTS expenses_customer_id_idx ON expenses(customer_id);
