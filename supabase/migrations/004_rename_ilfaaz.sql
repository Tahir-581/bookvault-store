-- Rename BookVault branding to ilfaaz in live store settings and content

UPDATE store_settings
SET value = jsonb_set(value, '{name}', '"ilfaaz"')
WHERE key = 'site';

UPDATE store_settings
SET value = replace(value::text, 'BookVault', 'ilfaaz')::jsonb
WHERE key = 'footer'
  AND value::text LIKE '%BookVault%';

UPDATE store_content_pages
SET
  title = replace(title, 'BookVault', 'ilfaaz'),
  body = replace(replace(body, 'BookVault', 'ilfaaz'), 'help@bookvault.co.uk', 'help@ilfaaz.com')
WHERE title ILIKE '%BookVault%'
   OR body ILIKE '%BookVault%'
   OR body ILIKE '%bookvault%';

UPDATE store_homepage_sections
SET title = replace(title, 'BookVault', 'ilfaaz')
WHERE title ILIKE '%BookVault%';
