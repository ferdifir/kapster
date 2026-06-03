-- supabase/migrations/20260603000003_demo_indexes.sql

-- Ensure only one active session exists at a time (prevents race condition)
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_sessions_unique_active
  ON public.demo_sessions ((true))
  WHERE status = 'active';

-- Index for getActiveSession query
CREATE INDEX IF NOT EXISTS idx_demo_sessions_status
  ON public.demo_sessions (status);

-- Index for processWaitlist cleanup queries
CREATE INDEX IF NOT EXISTS idx_demo_waitlist_status
  ON public.demo_waitlist (status);

CREATE INDEX IF NOT EXISTS idx_demo_waitlist_phone
  ON public.demo_waitlist (phone);
