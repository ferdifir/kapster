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
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can SELECT referral codes by code (for cookie lookup)
CREATE POLICY "Anyone can look up referral codes by code"
  ON referral_codes FOR SELECT
  USING (TRUE);

-- RLS: profile owners can view their own referral code
CREATE POLICY "Profile owners can view their referral code"
  ON referral_codes FOR SELECT
  USING (profile_id = auth.uid());

-- RLS: profile owners can update their own referral code
CREATE POLICY "Profile owners can update their referral code"
  ON referral_codes FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS: admins can view all referrals
CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- RLS: referrers can view their own referrals
CREATE POLICY "Referrers can view their own referrals"
  ON referrals FOR SELECT
  USING (referral_code_id IN (
    SELECT id FROM referral_codes WHERE profile_id = auth.uid()
  ));

-- RLS: admins can view all payout requests
CREATE POLICY "Admins can view all payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- RLS: referrers can view their own payout requests
CREATE POLICY "Referrers can view their own payout requests"
  ON payout_requests FOR SELECT
  USING (referral_code_id IN (
    SELECT id FROM referral_codes WHERE profile_id = auth.uid()
  ));

-- RLS: referrers can insert their own payout requests
CREATE POLICY "Referrers can insert payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (referral_code_id IN (
    SELECT id FROM referral_codes WHERE profile_id = auth.uid()
  ));

-- Function to atomically increment referral balance
CREATE OR REPLACE FUNCTION increment_referral_balance(
  p_referral_code_id UUID,
  p_amount INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE referral_codes
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount
  WHERE id = p_referral_code_id;
END;
$$ LANGUAGE plpgsql;
