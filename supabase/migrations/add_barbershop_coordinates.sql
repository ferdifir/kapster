ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);
