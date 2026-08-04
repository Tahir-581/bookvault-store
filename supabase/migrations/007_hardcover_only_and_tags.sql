-- Hardcover-only formats, drop Amazon badges, add custom tags vocabulary

-- Ensure every book has a hardcover format row (copy from cheapest existing format)
INSERT INTO store_book_formats (book_id, format, price, compare_at_price, stock, sku, is_active)
SELECT
  b.id,
  'hardcover',
  COALESCE(src.price, 0),
  src.compare_at_price,
  COALESCE(src.stock, 0),
  src.sku,
  COALESCE(src.is_active, true)
FROM store_books b
LEFT JOIN LATERAL (
  SELECT f.price, f.compare_at_price, f.stock, f.sku, f.is_active
  FROM store_book_formats f
  WHERE f.book_id = b.id
  ORDER BY
    CASE f.format
      WHEN 'hardcover' THEN 0
      WHEN 'paperback' THEN 1
      ELSE 2
    END,
    f.price ASC
  LIMIT 1
) src ON true
WHERE NOT EXISTS (
  SELECT 1 FROM store_book_formats hf
  WHERE hf.book_id = b.id AND hf.format = 'hardcover'
);

-- Point deals that reference non-hardcover formats at the book's hardcover row
UPDATE store_deals d
SET format_id = hf.id
FROM store_book_formats old_f
JOIN store_book_formats hf
  ON hf.book_id = old_f.book_id AND hf.format = 'hardcover'
WHERE d.format_id = old_f.id
  AND old_f.format <> 'hardcover';

-- Drop deals still pointing at non-hardcover formats (orphans)
DELETE FROM store_deals
WHERE format_id IN (
  SELECT id FROM store_book_formats WHERE format <> 'hardcover'
);

-- Remove non-hardcover format rows
DELETE FROM store_book_formats WHERE format <> 'hardcover';

-- Constrain to hardcover only
ALTER TABLE store_book_formats DROP CONSTRAINT IF EXISTS store_book_formats_format_check;
ALTER TABLE store_book_formats ADD CONSTRAINT store_book_formats_format_check
  CHECK (format IN ('hardcover'));

-- Wishlist default + existing values
ALTER TABLE store_wishlist_items ALTER COLUMN format SET DEFAULT 'hardcover';
UPDATE store_wishlist_items SET format = 'hardcover' WHERE format IS DISTINCT FROM 'hardcover';

-- Drop Amazon-style badge columns
ALTER TABLE store_books DROP COLUMN IF EXISTS is_prime_eligible;
ALTER TABLE store_books DROP COLUMN IF EXISTS is_first_reads;
ALTER TABLE store_books DROP COLUMN IF EXISTS is_audible_exclusive;

-- Custom tags vocabulary
CREATE TABLE IF NOT EXISTS store_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tags" ON store_tags FOR SELECT USING (true);
CREATE POLICY "Admin manage tags" ON store_tags FOR ALL USING (store_is_admin());

-- Clear format-based homepage filter pills sections
DELETE FROM store_homepage_sections
WHERE section_type = 'filter_pills';

-- Remove audiobook / print-format filtered homepage sections
DELETE FROM store_homepage_sections
WHERE config->>'format' IN ('audiobook', 'paperback', 'print')
   OR title ILIKE '%audible%';

-- Strip format query params from remaining see_more_hrefs
UPDATE store_homepage_sections
SET config = jsonb_set(
  config,
  '{see_more_href}',
  to_jsonb(
    regexp_replace(
      COALESCE(config->>'see_more_href', ''),
      '([?&])format=[^&]*&?',
      '\1',
      'g'
    )
  )
)
WHERE config ? 'see_more_href'
  AND config->>'see_more_href' ILIKE '%format=%';

-- Drop format key from homepage section configs
UPDATE store_homepage_sections
SET config = config - 'format'
WHERE config ? 'format';

-- Strip format filter nav items
UPDATE store_navigation_menus
SET items = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(items) AS elem
  WHERE elem->>'href' NOT ILIKE '%format=audiobook%'
    AND elem->>'href' NOT ILIKE '%format=print%'
    AND elem->>'href' NOT ILIKE '%format=paperback%'
    AND elem->>'label' NOT ILIKE '%audible%'
)
WHERE menu_key IN ('secondary', 'books_subnav');

-- Remove Audible from footer subsidiaries
UPDATE store_settings
SET value = jsonb_set(
  value,
  '{subsidiaries}',
  COALESCE(
    (
      SELECT jsonb_agg(sub)
      FROM jsonb_array_elements(COALESCE(value->'subsidiaries', '[]'::jsonb)) AS sub
      WHERE sub->>'label' NOT ILIKE '%audible%'
    ),
    '[]'::jsonb
  )
)
WHERE key = 'footer'
  AND value ? 'subsidiaries';
