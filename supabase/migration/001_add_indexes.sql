-- supabase/migration/001_add_indexes.sql
-- Adds indexes on frequently queried columns for performance optimization.

-- Index on customers.phone for uniqueness checks during create/update
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);

-- Index on expenses.customer_id for JOIN and WHERE queries
CREATE INDEX IF NOT EXISTS expenses_customer_id_idx ON expenses (customer_id);

-- Index on expenses.expense_date for date range filtering in dashboard/trend queries
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON expenses (expense_date);
