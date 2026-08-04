-- Per-book sale fields on hardcover format row
ALTER TABLE store_book_formats
  ADD COLUMN IF NOT EXISTS on_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_percent int,
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

ALTER TABLE store_book_formats
  DROP CONSTRAINT IF EXISTS store_book_formats_sale_percent_check;

ALTER TABLE store_book_formats
  ADD CONSTRAINT store_book_formats_sale_percent_check
  CHECK (sale_percent IS NULL OR (sale_percent >= 1 AND sale_percent <= 99));

-- Trending badge on books
ALTER TABLE store_books
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false;
