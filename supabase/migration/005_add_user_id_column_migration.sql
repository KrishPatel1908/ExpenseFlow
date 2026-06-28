-- 005_add_user_id_column_migration.sql

-- 1. Add user_id column allowing NULL temporarily
ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Associate all existing transactions with the current admin user (admin@gmail.com)
-- The admin user's ID in auth.users is '4983467b-0c53-45e2-8a3f-154af4b8432d'
UPDATE expenses SET user_id = '4983467b-0c53-45e2-8a3f-154af4b8432d' WHERE user_id IS NULL;

-- 3. Alter column to be NOT NULL now that it is fully populated
ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL;

-- 4. Create an index on user_id for fast queries
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
