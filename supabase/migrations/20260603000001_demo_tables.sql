-- supabase/migrations/20260603000001_demo_tables.sql

CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.demo_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_waitlist ENABLE ROW LEVEL SECURITY;
