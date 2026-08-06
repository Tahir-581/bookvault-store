-- Disable BookPass / membership program in site settings (customer UI gated on this flag)

UPDATE store_settings
SET value = jsonb_set(value, '{membershipEnabled}', 'false'::jsonb)
WHERE key = 'site'
  AND (value->>'membershipEnabled') IS DISTINCT FROM 'false';
