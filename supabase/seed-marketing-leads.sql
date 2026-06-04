-- supabase/seed-marketing-leads.sql
-- Seed 28 barbershop leads from OSINT research
-- Run: psql $DATABASE_URL -f supabase/seed-marketing-leads.sql

INSERT INTO public.marketing_leads (name, priority, contact, branches, city, instagram, notes) VALUES
('Captain Barbershop', 'HIGH', '0812-8077-7736', '130+', 'Jabodetabek/Bandung/Surabaya/Medan/Karawang', '@captainbarbershopid', 'Chain terbesar'),
('Barberpedia', 'HIGH', '+62-857-1814-1125', '45+', 'Jakarta/Tangerang/Karawaci', '@barberpedia.official', NULL),
('Di Bawah Pohon', 'HIGH', '0811-153-7327', '10+', 'BSD/Menteng/Tangsel/Jakpus', '@dibawahpohon_', NULL),
('BarberKing Indonesia', 'HIGH', '0821-7733-2015', '21+', 'JOGLOSEMAR', '@barberking', NULL),
('Lanang Barbershop', 'HIGH', '0831-3723-0858', '100+', 'Jabodetabek/Semarang', '@lanangbarbershop01', NULL),
('Raja Cukur Barbershop', 'HIGH', '081-2283-0798', '370+', 'Semarang (HQ)', '@rajacukur_pusat', 'WA admin'),
('Moxie Barbershop', 'HIGH', '0812-9832-2009', '17+', 'Jawa/Lampung', '@moxie_barbers', NULL),
('Serious Cut Barbershop', 'HIGH', '+62-821-1111-8692', '120+', 'Pulau Jawa', '@seriouscut_barbershop', 'WA kemitraan'),
('Deft Barber', 'HIGH', '+62-857-7777-5749', '60+', 'Bogor/Jabodetabek/Sumsel', '@deftbarber', NULL),
('Studio Potong', 'HIGH', '0815-1996-7292', '10+', 'Jakarta/Tangerang/Karawang/Denpasar', '@studiopotong', 'WA admin 1'),
('Vegas Barbershop', 'HIGH', '+62-857-3968-7214', '10+', 'Bali', '@vegas_barbershop', NULL),
('Barberia', 'MEDIUM', '+62-21-23580339', '5+', 'Jakarta', '@barberia_id', NULL),
('Giovani Barbershop', 'MEDIUM', '0811-6518-018', '—', 'Medan', '@giovani_barbershop', NULL),
('Barbertopia', 'MEDIUM', '0812-1050-4068', '—', 'Indonesia', NULL, NULL),
('Paxi Barbershop', 'MEDIUM', '(021) 29528493', '4', 'Jakarta', '@paxi_barbershop', NULL),
('Tohang''s Barber', 'MEDIUM', '0812-8888-4782', '9+', 'Jakarta/Tangerang/Bogor', '@tohangsbarber', 'WA kemitraan'),
('Barberbox', 'MEDIUM', '0812-9439-5909', '4', 'Jakarta Selatan', '@barberbox_senayan', NULL),
('Broadway Barbershop', 'MEDIUM', '0812-3454-9090', '3+', 'Surabaya', '@broadwaybarber.id', NULL),
('The Original Barbershop', 'MEDIUM', '0813-3669-9902', '4', 'Surabaya', '@theoriginalbarbers', NULL),
('Spartan Barbershop', 'MEDIUM', '082-111-880-882', '3', 'Medan', '@spartan_ringroad', NULL),
('NKRI Barbershop', 'MEDIUM', '0878-6788-8880', '5', 'Bangil/Pandaan/Surabaya', '@nkri_barbershop', NULL),
('Pax Wijaya', 'LOW', '(021) 7207138', '1', 'Jakarta Selatan', NULL, 'Legendaris since 1965'),
('Rogue & Beyond', 'LOW', '+62-811-866-651', '1', 'Jakarta Selatan', '@rogueandbeyond', NULL),
('ELDER Barberhouse', 'LOW', '+62-812-3667-8589', '1', 'Jakarta Selatan', '@elderbarberhouse', NULL),
('Good Willie Barber Shop', 'LOW', '+62-21-22322938', '1', 'Jakarta Timur', '@goodwilliebarbershop', NULL),
('Cukur Hade Barbershop', 'LOW', '+62-822-1665-5665', '1', 'Bandung', '@cukurhade3.barbershop', NULL),
('Dutchman Barbershop', 'LOW', '0821-1000-9744', '1', 'Surabaya', '@dutchmanbarbershop', NULL),
('Sobat Barbershop', 'LOW', '0859-1065-07808', '1', 'Surabaya', NULL, NULL);

-- Log import activity for each lead
INSERT INTO public.marketing_lead_activities (lead_id, activity_type, description)
SELECT id, 'note', 'Lead diimport dari hasil riset OSINT'
FROM public.marketing_leads;
