-- Remove foreign key and drop customers table
ALTER TABLE IF EXISTS expenses DROP CONSTRAINT IF EXISTS expenses_customer_id_fkey;
DROP TABLE IF EXISTS customers;

-- Alter expenses table to add customer_name and customer_phone
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Set customer_name to NOT NULL
ALTER TABLE expenses ALTER COLUMN customer_name SET NOT NULL;

-- Remove the old customer_id column
ALTER TABLE expenses DROP COLUMN IF EXISTS customer_id;

-- Add index on customer_name
CREATE INDEX IF NOT EXISTS expenses_customer_name_idx ON expenses(customer_name);
