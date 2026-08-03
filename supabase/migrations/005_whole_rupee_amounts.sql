-- Use whole-rupee shipping amounts (no decimal paisa)

UPDATE store_settings
SET value = jsonb_set(
  jsonb_set(value, '{standardShipping}', '4'),
  '{expressShipping}',
  '8'
),
updated_at = now()
WHERE key = 'site';
