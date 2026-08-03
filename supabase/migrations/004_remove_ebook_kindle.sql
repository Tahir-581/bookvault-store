-- Remove ebook format, Kindle Unlimited badge, and all Kindle branding from live data

-- Deals that reference ebook formats
DELETE FROM store_deals
WHERE format_id IN (SELECT id FROM store_book_formats WHERE format = 'ebook');

-- Wishlist lines that selected ebook
UPDATE store_wishlist_items SET format = 'paperback' WHERE format = 'ebook';

-- Ebook format rows (order_items.format_id becomes NULL via ON DELETE SET NULL)
DELETE FROM store_book_formats WHERE format = 'ebook';

-- Constrain formats to print + audiobook only
ALTER TABLE store_book_formats DROP CONSTRAINT IF EXISTS store_book_formats_format_check;
ALTER TABLE store_book_formats ADD CONSTRAINT store_book_formats_format_check
  CHECK (format IN ('paperback', 'hardcover', 'audiobook'));

-- Kindle Unlimited column
ALTER TABLE store_books DROP COLUMN IF EXISTS is_kindle_unlimited;

-- Strip ebook / Kindle nav items from menus
UPDATE store_navigation_menus
SET items = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(items) AS elem
  WHERE elem->>'href' IS DISTINCT FROM '/books?format=ebook'
    AND elem->>'label' NOT ILIKE '%kindle%'
    AND elem->>'label' NOT ILIKE '%ebook%'
)
WHERE menu_key IN ('secondary', 'books_subnav');

-- Remove ebook-filtered homepage sections
DELETE FROM store_homepage_sections
WHERE config->>'format' = 'ebook'
   OR title ILIKE '%kindle%';

-- Drop Kindle eBooks (and any ebook) pills from filter_pills configs
UPDATE store_homepage_sections
SET config = jsonb_set(
  config,
  '{pills}',
  COALESCE(
    (
      SELECT jsonb_agg(pill)
      FROM jsonb_array_elements(COALESCE(config->'pills', '[]'::jsonb)) AS pill
      WHERE pill->>'href' IS DISTINCT FROM '/books?format=ebook'
        AND pill->>'label' NOT ILIKE '%kindle%'
        AND pill->>'label' NOT ILIKE '%ebook%'
    ),
    '[]'::jsonb
  )
)
WHERE section_type = 'filter_pills'
  AND config ? 'pills';

-- Remove ebooksEnabled from site settings
UPDATE store_settings
SET value = value - 'ebooksEnabled'
WHERE key = 'site' AND value ? 'ebooksEnabled';

-- Remove Kindle Direct Publishing from footer subsidiaries
UPDATE store_settings
SET value = jsonb_set(
  value,
  '{subsidiaries}',
  COALESCE(
    (
      SELECT jsonb_agg(sub)
      FROM jsonb_array_elements(COALESCE(value->'subsidiaries', '[]'::jsonb)) AS sub
      WHERE sub->>'label' NOT ILIKE '%kindle%'
    ),
    '[]'::jsonb
  )
)
WHERE key = 'footer'
  AND value ? 'subsidiaries';
