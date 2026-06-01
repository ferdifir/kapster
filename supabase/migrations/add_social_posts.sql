-- supabase/migrations/add_social_posts.sql

CREATE TABLE IF NOT EXISTS social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'both')),
  caption         TEXT NOT NULL,
  topics          TEXT[] DEFAULT '{}',
  content_type    TEXT NOT NULL CHECK (content_type IN ('educational', 'solution', 'social_proof')),
  trend_analysis  JSONB DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_telegram', 'posted_ig', 'posted_tt')),
  telegram_msg_id INTEGER,
  scheduled_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts (status);
CREATE INDEX IF NOT EXISTS idx_social_posts_date ON social_posts (scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_topics ON social_posts USING GIN (topics);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published social posts are publicly readable"
  ON social_posts FOR SELECT
  USING (status IN ('sent_to_telegram', 'posted_ig', 'posted_tt'));
