CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('kritik', 'saran', 'feedback', 'request_fitur')),
  message text NOT NULL,
  screenshot_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read feedback" ON public.feedback;
CREATE POLICY "Owners can read feedback"
ON public.feedback FOR SELECT
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can update feedback" ON public.feedback;
CREATE POLICY "Owners can update feedback"
ON public.feedback FOR UPDATE
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners can delete feedback" ON public.feedback;
CREATE POLICY "Owners can delete feedback"
ON public.feedback FOR DELETE
USING (
  barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_id = auth.uid())
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback', 'feedback', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Feedback screenshots are publicly accessible" ON storage.objects;
CREATE POLICY "Feedback screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback');

DROP POLICY IF EXISTS "Authenticated users can upload feedback screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback' AND auth.role() = 'authenticated'
  AND (SELECT owner_id FROM public.barbershops WHERE id = (storage.foldername(name))[1]::uuid) = auth.uid()
);

DROP POLICY IF EXISTS "Owners can delete feedback screenshots" ON storage.objects;
CREATE POLICY "Owners can delete feedback screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feedback' AND auth.role() = 'authenticated'
  AND (SELECT owner_id FROM public.barbershops WHERE id = (storage.foldername(name))[1]::uuid) = auth.uid()
);
