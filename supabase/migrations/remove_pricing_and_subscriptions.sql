-- Remove all pricing/subscription related database objects
-- Since Kapster is now 100% free, we no longer need:
-- - payments table
-- - subscriptions table
-- - plan column in barbershops
-- - plan_type and subscription_status enums

-- Drop payments table if it exists
DROP TABLE IF EXISTS payments CASCADE;

-- Drop subscriptions table if it exists
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Remove plan column from barbershops if it exists
ALTER TABLE barbershops DROP COLUMN IF EXISTS plan;

-- Drop the enums if no other tables depend on them
-- (CASCADE ensures we don't fail if they're already unused)
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
