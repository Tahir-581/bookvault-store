-- Amazon homepage: audiobook format, book badges, filter_pills section type, nav + footer seeds

-- Audiobook format (paperback/hardcover/audiobook only — no ebook)
ALTER TABLE store_book_formats DROP CONSTRAINT IF EXISTS store_book_formats_format_check;
ALTER TABLE store_book_formats ADD CONSTRAINT store_book_formats_format_check
  CHECK (format IN ('paperback', 'hardcover', 'audiobook'));

-- Book service badges
ALTER TABLE store_books ADD COLUMN IF NOT EXISTS is_prime_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE store_books ADD COLUMN IF NOT EXISTS is_first_reads boolean NOT NULL DEFAULT false;
ALTER TABLE store_books ADD COLUMN IF NOT EXISTS is_audible_exclusive boolean NOT NULL DEFAULT false;

-- filter_pills section type
ALTER TABLE store_homepage_sections DROP CONSTRAINT IF EXISTS store_homepage_sections_section_type_check;
ALTER TABLE store_homepage_sections ADD CONSTRAINT store_homepage_sections_section_type_check
  CHECK (section_type IN ('carousel', 'category_tiles', 'book_row', 'editorial', 'filter_pills'));

-- Books sub-nav menu
INSERT INTO store_navigation_menus (menu_key, label, items) VALUES
  ('books_subnav', 'Books Department Nav', '[
    {"label":"Categories","href":"/categories","children":[{"label":"Fiction","href":"/books/fiction"},{"label":"Non-Fiction","href":"/books/non-fiction"},{"label":"Mystery","href":"/books/mystery"},{"label":"Romance","href":"/books/romance"},{"label":"Sci-Fi & Fantasy","href":"/books/sci-fi-fantasy"},{"label":"Children''s Books","href":"/books/childrens"}]},
    {"label":"New & Trending","href":"/books?sort=newest","children":[{"label":"New Releases","href":"/books?sort=newest"},{"label":"Trending Now","href":"/books?sort=bestseller"}]},
    {"label":"Deals","href":"/deals","children":[{"label":"Today''s Deals","href":"/deals"},{"label":"Lightning Deals","href":"/deals"}]},
    {"label":"Best Sellers & More","href":"/books?sort=bestseller","children":[{"label":"Best Sellers","href":"/books?sort=bestseller"},{"label":"Most Wished For","href":"/books?sort=rating"}]},
    {"label":"Memberships","href":"/account/membership","children":[{"label":"BookPass","href":"/account/membership"}]},
    {"label":"More","href":"/books","children":[{"label":"All Books","href":"/books"},{"label":"Help","href":"/pages/help"}]}
  ]'::jsonb)
ON CONFLICT (menu_key) DO UPDATE SET items = EXCLUDED.items, label = EXCLUDED.label;

-- Expanded footer settings
UPDATE store_settings SET value = '{
  "columns": [
    {"title":"Get to Know Us","links":[{"label":"Careers","href":"/pages/careers"},{"label":"About Us","href":"/pages/about"},{"label":"Sustainability","href":"/pages/about"}]},
    {"title":"Make Money with Us","links":[{"label":"Sell on Ilfaaz","href":"/pages/help"},{"label":"Associates Programme","href":"/pages/help"},{"label":"Advertise Your Products","href":"/pages/help"},{"label":"Independently Publish with Us","href":"/pages/help"}]},
    {"title":"Payment Methods","links":[{"label":"Gift Cards","href":"/pages/payment"},{"label":"Payment Methods Help","href":"/pages/payment"},{"label":"Shop with Points","href":"/pages/payment"}]},
    {"title":"Let Us Help You","links":[{"label":"Track Packages or View Orders","href":"/account/orders"},{"label":"Delivery Rates & Policies","href":"/pages/help"},{"label":"Returns & Replacements","href":"/pages/returns"},{"label":"Customer Service","href":"/pages/help"},{"label":"Accessibility","href":"/pages/help"}]}
  ],
  "subsidiaries": [
    {"label":"Audible","description":"Download Audiobooks","href":"/books?format=audiobook"},
    {"label":"Goodreads","description":"Book reviews & recommendations","href":"/pages/about"},
    {"label":"IMDb","description":"Movies, TV & Celebrities","href":"/pages/about"},
    {"label":"AbeBooks","description":"Books, art & collectables","href":"/books"},
    {"label":"Amazon Business","description":"Service for business customers","href":"/pages/help"}
  ],
  "legalLinks": [
    {"label":"Conditions of Use & Sale","href":"/pages/help"},
    {"label":"Privacy Notice","href":"/pages/about"},
    {"label":"Cookies Notice","href":"/pages/about"},
    {"label":"Interest-Based Ads Notice","href":"/pages/about"}
  ],
  "copyright": "© 1996-2026, Ilfaaz. All rights reserved."
}'::jsonb
WHERE key = 'footer';
