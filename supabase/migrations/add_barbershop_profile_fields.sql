-- Add cover image and about/description columns to barbershops table
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS about text;

-- Add comment for documentation
COMMENT ON COLUMN barbershops.cover_image_url IS 'URL for the barbershop hero/cover image on public profile page';
COMMENT ON COLUMN barbershops.about IS 'Description/about text for the barbershop public profile';
