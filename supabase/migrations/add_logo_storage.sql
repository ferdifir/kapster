-- Create storage bucket for barbershop logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to logo files
CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Policy: Allow authenticated users to upload logos
-- The file path is logos/{barbershop_id}/logo.{ext}
-- We verify the user owns the barbershop by checking the barbershops table
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to update (overwrite) their logos
CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to delete their old logos
CREATE POLICY "Authenticated users can delete their logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);
