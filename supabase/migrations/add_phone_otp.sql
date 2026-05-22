-- Add phone_verified_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create phone_otp_codes table
CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('registration_verification', 'password_reset')),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_codes_phone_purpose ON phone_otp_codes(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_phone_otp_codes_expires ON phone_otp_codes(expires_at);

-- Enable RLS
ALTER TABLE phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can insert OTP codes (needed for unauthenticated forgot-password flow)
CREATE POLICY "Anyone can insert OTP codes"
  ON phone_otp_codes FOR INSERT
  WITH CHECK (true);

-- RLS: anyone can select OTP codes by phone (the code_hash provides security)
CREATE POLICY "Anyone can select OTP codes by phone"
  ON phone_otp_codes FOR SELECT
  USING (true);

-- RLS: anyone can update OTP codes (verify/reset flow)
CREATE POLICY "Anyone can update OTP codes"
  ON phone_otp_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);
