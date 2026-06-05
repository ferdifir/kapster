CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  payload JSONB DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 3,
  target_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_agent TEXT,
  decision JSONB,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  report_sent BOOLEAN DEFAULT false,
  notes TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_events_status_priority ON agent_events (status, priority DESC);
CREATE INDEX idx_agent_events_created_at ON agent_events (created_at DESC);

CREATE TABLE IF NOT EXISTS agent_custom_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_definition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, tool_name)
);

ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_custom_tools ENABLE ROW LEVEL SECURITY;

-- Superadmin can read all events for monitoring
CREATE POLICY "superadmin_read_agent_events" ON agent_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_read_agent_custom_tools" ON agent_custom_tools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );
