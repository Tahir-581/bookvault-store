-- Homepage-featured categories + category_shelves section type

ALTER TABLE store_categories
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_sort_order int NOT NULL DEFAULT 0;

ALTER TABLE store_homepage_sections DROP CONSTRAINT IF EXISTS store_homepage_sections_section_type_check;
ALTER TABLE store_homepage_sections ADD CONSTRAINT store_homepage_sections_section_type_check
  CHECK (section_type IN (
    'carousel',
    'category_tiles',
    'category_shelves',
    'book_row',
    'editorial',
    'filter_pills'
  ));
