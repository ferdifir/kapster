-- supabase/migrations/20260604000001_marketing_leads.sql
-- Marketing CRM: leads + activity log for Kapster admin outreach

CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  branches text,
  city text,
  instagram text,
  priority text NOT NULL DEFAULT 'LOW' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'demo', 'customer', 'closed')),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('note', 'wa_sent', 'status_change')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_leads_status_idx ON public.marketing_leads(status);
CREATE INDEX IF NOT EXISTS marketing_leads_priority_idx ON public.marketing_leads(priority);
CREATE INDEX IF NOT EXISTS marketing_lead_activities_lead_id_idx ON public.marketing_lead_activities(lead_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_marketing_lead_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_marketing_lead_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketing_lead_updated_at();

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_lead_activities ENABLE ROW LEVEL SECURITY;

-- Accessible to barbershop owners and superadmins
CREATE POLICY "admin_all_marketing_leads" ON public.marketing_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'superadmin')
    )
  );

CREATE POLICY "admin_all_marketing_lead_activities" ON public.marketing_lead_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'superadmin')
    )
  );
