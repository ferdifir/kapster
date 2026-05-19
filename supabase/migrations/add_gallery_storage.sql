-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

-- Policy: Allow authenticated users (barbershop owners) to upload
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update their gallery images
CREATE POLICY "Authenticated users can update their gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete their gallery images
CREATE POLICY "Authenticated users can delete their gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);
