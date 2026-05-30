DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_barbershop_subscription UNIQUE (barbershop_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  pakasir_order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 10000,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_barbershop_id ON subscriptions(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_payments_barbershop_id ON payments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_payments_pakasir_order_id ON payments(pakasir_order_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS: barbershop owners can view their subscription
CREATE POLICY "Owners can view their subscription"
  ON subscriptions FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- RLS: owners can update their subscription (e.g. cancel)
CREATE POLICY "Owners can update their subscription"
  ON subscriptions FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ))
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- RLS: owners can view their payments
CREATE POLICY "Owners can view their payments"
  ON payments FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- RLS: authenticated users can insert payments (required for pay button)
CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- Note: Webhook endpoint uses service_role key which bypasses RLS entirely,
-- so no policy is needed for webhook operations (payment updates, subscription upserts).
