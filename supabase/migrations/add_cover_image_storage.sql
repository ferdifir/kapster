-- Create storage bucket for barbershop cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-images', 'cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-images');

-- Policy: Allow authenticated users (barbershop owners) to upload
CREATE POLICY "Authenticated users can upload cover images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cover-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update their cover images
CREATE POLICY "Authenticated users can update their cover images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cover-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete their cover images
CREATE POLICY "Authenticated users can delete their cover images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cover-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
    AND owner_id = auth.uid()
  )
);
