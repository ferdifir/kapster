-- Per-user demo accounts: each request gets its own auth user

-- Add auth_user_id and email to track which auth user belongs to this session
ALTER TABLE public.demo_sessions
  ADD COLUMN auth_user_id UUID,
  ADD COLUMN email TEXT;

-- Drop waitlist table (no longer needed — no shared-account contention)
DROP TABLE IF EXISTS public.demo_waitlist;

-- Drop indexes on waitlist table
DROP INDEX IF EXISTS idx_demo_waitlist_status;
DROP INDEX IF EXISTS idx_demo_waitlist_phone;

-- Drop unique active session constraint (now multiple sessions can coexist)
DROP INDEX IF EXISTS idx_demo_sessions_unique_active;
