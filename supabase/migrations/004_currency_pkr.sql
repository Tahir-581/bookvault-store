-- Switch store currency from GBP (British Pound) to PKR (Pakistani Rupee)

ALTER TABLE store_orders
  ALTER COLUMN currency SET DEFAULT 'PKR';

UPDATE store_orders
SET currency = 'PKR'
WHERE currency = 'GBP';

UPDATE store_settings
SET value = jsonb_set(
  jsonb_set(value, '{currency}', '"PKR"'),
  '{locale}',
  '"en-PK"'
),
updated_at = now()
WHERE key = 'site'
  AND (
    value->>'currency' = 'GBP'
    OR value->>'locale' = 'en-GB'
  );

UPDATE store_settings
SET value = jsonb_set(
  value,
  '{text}',
  '"Free delivery on orders over Rs 25"'
),
updated_at = now()
WHERE key = 'announcement'
  AND value->>'text' LIKE '%£%';
