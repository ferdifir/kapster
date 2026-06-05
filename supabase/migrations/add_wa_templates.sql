ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS wa_templates JSONB DEFAULT NULL;

COMMENT ON COLUMN barbershops.wa_templates IS 'Per-barbershop WhatsApp message template overrides. Keys are event_types, values are template strings. Falls back to system defaults when NULL or missing key.';
