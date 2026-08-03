-- Rename BookVault branding to Ilfaaz in live store settings and content

UPDATE store_settings
SET value = jsonb_set(value, '{name}', '"Ilfaaz"')
WHERE key = 'site';

UPDATE store_settings
SET value = replace(value::text, 'BookVault', 'Ilfaaz')::jsonb
WHERE key = 'footer'
  AND value::text LIKE '%BookVault%';

UPDATE store_content_pages
SET
  title = replace(title, 'BookVault', 'Ilfaaz'),
  body = replace(replace(body, 'BookVault', 'Ilfaaz'), 'help@bookvault.co.uk', 'help@ilfaaz.com')
WHERE title ILIKE '%BookVault%'
   OR body ILIKE '%BookVault%'
   OR body ILIKE '%bookvault%';

UPDATE store_homepage_sections
SET title = replace(title, 'BookVault', 'Ilfaaz')
WHERE title ILIKE '%BookVault%';
