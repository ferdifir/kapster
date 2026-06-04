DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('pending', 'earned', 'paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT,
  wa_number TEXT,
  code TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  commission INTEGER NOT NULL DEFAULT 3500,
  earned_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referral_barbershop UNIQUE (barbershop_id)
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 25000),
  method TEXT,
  bank_info JSONB,
  status payout_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON referral_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code_id ON referrals(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referrals_barbershop_id ON referrals(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- Security definer function for public referral code lookup
-- Only exposes non-sensitive columns (no access_token, balance, etc.)
CREATE OR REPLACE FUNCTION public.lookup_referral_code(p_code TEXT)
RETURNS TABLE (id UUID, code TEXT, profile_id UUID, name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT rc.id, rc.code, rc.profile_id, rc.name
  FROM referral_codes rc
  WHERE rc.code = p_code;
END;
$$;

-- Function to atomically increment referral balance
CREATE OR REPLACE FUNCTION public.increment_referral_balance(
  p_referral_code_id UUID,
  p_amount INTEGER
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE referral_codes
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount
  WHERE id = p_referral_code_id;
END;
$$;

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- All mutations go through service_role (admin client) or security definer functions.
-- RLS policies below serve for direct queries when needed.

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners can view their referral code" ON referral_codes;
  CREATE POLICY "Owners can view their referral code"
    ON referral_codes FOR SELECT
    USING (profile_id = auth.uid());
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners can update their referral code" ON referral_codes;
  CREATE POLICY "Owners can update their referral code"
    ON referral_codes FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Superadmins can view all referrals" ON referrals;
  CREATE POLICY "Superadmins can view all referrals"
    ON referrals FOR SELECT
    USING (auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'superadmin'
    ));
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners can view own referrals" ON referrals;
  CREATE POLICY "Owners can view own referrals"
    ON referrals FOR SELECT
    USING (referral_code_id IN (
      SELECT id FROM referral_codes WHERE profile_id = auth.uid()
    ));
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Superadmins can view all payout requests" ON payout_requests;
  CREATE POLICY "Superadmins can view all payout requests"
    ON payout_requests FOR SELECT
    USING (auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'superadmin'
    ));
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners can view own payout requests" ON payout_requests;
  CREATE POLICY "Owners can view own payout requests"
    ON payout_requests FOR SELECT
    USING (referral_code_id IN (
      SELECT id FROM referral_codes WHERE profile_id = auth.uid()
    ));
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners can insert payout requests" ON payout_requests;
  CREATE POLICY "Owners can insert payout requests"
    ON payout_requests FOR INSERT
    WITH CHECK (referral_code_id IN (
      SELECT id FROM referral_codes WHERE profile_id = auth.uid()
    ));
END $$;
