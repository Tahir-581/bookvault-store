-- Normalize brand casing from "Ilfaaz" to "ilfaaz" in store content

UPDATE store_settings
SET value = jsonb_set(value, '{name}', '"ilfaaz"')
WHERE key = 'site'
  AND value->>'name' IS DISTINCT FROM 'ilfaaz';

UPDATE store_settings
SET value = replace(value::text, 'Ilfaaz', 'ilfaaz')::jsonb
WHERE key = 'footer'
  AND value::text LIKE '%Ilfaaz%';

UPDATE store_homepage_sections
SET title = replace(title, 'Ilfaaz', 'ilfaaz')
WHERE title LIKE '%Ilfaaz%';

UPDATE store_content_pages
SET
  title = replace(title, 'Ilfaaz', 'ilfaaz'),
  body = replace(body, 'Ilfaaz', 'ilfaaz')
WHERE title LIKE '%Ilfaaz%'
   OR body LIKE '%Ilfaaz%';
