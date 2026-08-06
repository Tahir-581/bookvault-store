-- ilfaaz Store Schema

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Admin helper (reuse existing admin_profiles table)
CREATE OR REPLACE FUNCTION store_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND status = 'active'
  );
$$;

-- Site settings (key/value JSON)
CREATE TABLE IF NOT EXISTS store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories (nested tree)
CREATE TABLE IF NOT EXISTS store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES store_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Authors
CREATE TABLE IF NOT EXISTS store_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Books
CREATE TABLE IF NOT EXISTS store_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  isbn text,
  publisher text,
  publication_date date,
  language text DEFAULT 'English',
  page_count int,
  cover_url text,
  author_id uuid REFERENCES store_authors(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_new_release boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  search_vector tsvector,
  seo_title text,
  seo_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_books_search_idx ON store_books USING gin(search_vector);
CREATE INDEX IF NOT EXISTS store_books_title_trgm ON store_books USING gin(title gin_trgm_ops);

CREATE OR REPLACE FUNCTION store_books_search_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.author_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS store_books_search_trigger ON store_books;
CREATE TRIGGER store_books_search_trigger
  BEFORE INSERT OR UPDATE ON store_books
  FOR EACH ROW EXECUTE FUNCTION store_books_search_update();

-- Book formats
CREATE TABLE IF NOT EXISTS store_book_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  format text NOT NULL CHECK (format IN ('paperback', 'hardcover', 'audiobook')),
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  stock int NOT NULL DEFAULT 0,
  sku text,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(book_id, format)
);

-- Book categories M2M
CREATE TABLE IF NOT EXISTS store_book_categories (
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES store_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, category_id)
);

-- Book images gallery
CREATE TABLE IF NOT EXISTS store_book_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0
);

-- Addresses
CREATE TABLE IF NOT EXISTS store_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'Home',
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  county text,
  postcode text NOT NULL,
  country text NOT NULL DEFAULT 'United Kingdom',
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_total numeric(10,2) NOT NULL DEFAULT 0,
  shipping_fee numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  coupon_code text,
  shipping_address jsonb NOT NULL DEFAULT '{}',
  gift_message text,
  gift_wrap boolean NOT NULL DEFAULT false,
  delivery_speed text DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  book_id uuid REFERENCES store_books(id) ON DELETE SET NULL,
  format_id uuid REFERENCES store_book_formats(id) ON DELETE SET NULL,
  title text NOT NULL,
  author text NOT NULL,
  format text NOT NULL,
  cover_url text,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS store_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text NOT NULL,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  helpful_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coupons
CREATE TABLE IF NOT EXISTS store_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_kind text NOT NULL CHECK (discount_kind IN ('percent','fixed','free_shipping')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_uses int,
  use_count int NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES store_coupons(id) ON DELETE CASCADE,
  email text NOT NULL,
  order_id uuid REFERENCES store_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, email)
);

-- Deals (lightning deals)
CREATE TABLE IF NOT EXISTS store_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  format_id uuid REFERENCES store_book_formats(id) ON DELETE CASCADE,
  deal_price numeric(10,2) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS store_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Wishlist',
  is_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL REFERENCES store_wishlists(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES store_books(id) ON DELETE CASCADE,
  format text DEFAULT 'paperback',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, book_id)
);

-- CMS: Homepage sections
CREATE TABLE IF NOT EXISTS store_homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type text NOT NULL CHECK (section_type IN ('carousel','category_tiles','book_row','editorial')),
  title text,
  subtitle text,
  config jsonb NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CMS: Navigation menus
CREATE TABLE IF NOT EXISTS store_navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text NOT NULL UNIQUE,
  label text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS: Content pages
CREATE TABLE IF NOT EXISTS store_content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  is_published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Memberships
CREATE TABLE IF NOT EXISTS store_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'BookPass',
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 7.99,
  benefits jsonb NOT NULL DEFAULT '[]',
  free_shipping_threshold numeric(10,2) DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES store_memberships(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  UNIQUE(user_id, membership_id)
);

-- Admin audit logs (reuse pattern)
CREATE TABLE IF NOT EXISTS store_admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RPC: Get order by number
CREATE OR REPLACE FUNCTION get_store_order_by_number(p_order_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order', row_to_json(o.*),
    'items', COALESCE((
      SELECT jsonb_agg(row_to_json(i.*))
      FROM store_order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb),
    'events', COALESCE((
      SELECT jsonb_agg(row_to_json(e.*) ORDER BY e.created_at)
      FROM store_order_events e WHERE e.order_id = o.id
    ), '[]'::jsonb)
  ) INTO result
  FROM store_orders o
  WHERE o.order_number = p_order_number;
  RETURN result;
END;
$$;

-- RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_book_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_book_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON store_categories FOR SELECT USING (is_active = true OR store_is_admin());
CREATE POLICY "Public read authors" ON store_authors FOR SELECT USING (true);
CREATE POLICY "Public read books" ON store_books FOR SELECT USING (is_active = true OR store_is_admin());
CREATE POLICY "Public read formats" ON store_book_formats FOR SELECT USING (is_active = true OR store_is_admin());
CREATE POLICY "Public read book categories" ON store_book_categories FOR SELECT USING (true);
CREATE POLICY "Public read book images" ON store_book_images FOR SELECT USING (true);
CREATE POLICY "Public read approved reviews" ON store_reviews FOR SELECT USING (status = 'approved' OR store_is_admin() OR user_id = auth.uid());
CREATE POLICY "Public read active deals" ON store_deals FOR SELECT USING (is_active = true OR store_is_admin());
CREATE POLICY "Public read homepage" ON store_homepage_sections FOR SELECT USING (is_active = true OR store_is_admin());
CREATE POLICY "Public read menus" ON store_navigation_menus FOR SELECT USING (true);
CREATE POLICY "Public read pages" ON store_content_pages FOR SELECT USING (is_published = true OR store_is_admin());
CREATE POLICY "Public read memberships" ON store_memberships FOR SELECT USING (is_active = true OR store_is_admin());

-- User policies
CREATE POLICY "Users manage own addresses" ON store_addresses FOR ALL USING (user_id = auth.uid() OR store_is_admin());
CREATE POLICY "Users read own orders" ON store_orders FOR SELECT USING (user_id = auth.uid() OR email = auth.jwt()->>'email' OR store_is_admin());
CREATE POLICY "Users create orders" ON store_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage orders" ON store_orders FOR ALL USING (store_is_admin());
CREATE POLICY "Read order items" ON store_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM store_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR store_is_admin()))
);
CREATE POLICY "Insert order items" ON store_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Read order events" ON store_order_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM store_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR store_is_admin()))
);
CREATE POLICY "Insert order events" ON store_order_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users write reviews" ON store_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users read own reviews" ON store_reviews FOR SELECT USING (user_id = auth.uid() OR status = 'approved' OR store_is_admin());
CREATE POLICY "Users manage wishlists" ON store_wishlists FOR ALL USING (user_id = auth.uid() OR store_is_admin());
CREATE POLICY "Users manage wishlist items" ON store_wishlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM store_wishlists w WHERE w.id = wishlist_id AND (w.user_id = auth.uid() OR store_is_admin()))
);
CREATE POLICY "Users read own memberships" ON store_user_memberships FOR SELECT USING (user_id = auth.uid() OR store_is_admin());

-- Admin write policies
CREATE POLICY "Admin manage settings" ON store_settings FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage categories" ON store_categories FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage authors" ON store_authors FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage books" ON store_books FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage formats" ON store_book_formats FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage book categories" ON store_book_categories FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage book images" ON store_book_images FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage reviews" ON store_reviews FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage coupons" ON store_coupons FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage redemptions" ON store_coupon_redemptions FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage deals" ON store_deals FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage homepage" ON store_homepage_sections FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage menus" ON store_navigation_menus FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage pages" ON store_content_pages FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage memberships" ON store_memberships FOR ALL USING (store_is_admin());
CREATE POLICY "Admin manage user memberships" ON store_user_memberships FOR ALL USING (store_is_admin());
CREATE POLICY "Admin read audit logs" ON store_admin_audit_logs FOR SELECT USING (store_is_admin());
CREATE POLICY "Admin write audit logs" ON store_admin_audit_logs FOR INSERT WITH CHECK (store_is_admin());

-- Public can validate coupons (read active)
CREATE POLICY "Public read active coupons" ON store_coupons FOR SELECT USING (is_active = true OR store_is_admin());

-- Seed default settings
INSERT INTO store_settings (key, value) VALUES
  ('site', '{"name":"ilfaaz","tagline":"Your favourite books, delivered fast","currency":"PKR","locale":"en-PK","primaryColor":"#B8863E","secondaryColor":"#4A1C2E","membershipName":"BookPass","freeShippingThreshold":25,"taxRate":0.20,"standardShipping":4,"expressShipping":8,"guestCheckout":true,"reviewsEnabled":true,"wishlistsEnabled":true,"membershipEnabled":true}'::jsonb),
  ('announcement', '{"text":"Free delivery on orders over Rs 25","isActive":true}'::jsonb),
  ('footer', '{"columns":[{"title":"Get to Know Us","links":[{"label":"About ilfaaz","href":"/pages/about"},{"label":"Careers","href":"/pages/careers"}]},{"title":"Let Us Help You","links":[{"label":"Help","href":"/pages/help"},{"label":"Returns","href":"/pages/returns"}]},{"title":"Payment","links":[{"label":"Payment Methods","href":"/pages/payment"}]}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO store_memberships (name, description, price_monthly, benefits, free_shipping_threshold) VALUES
  ('BookPass', 'Free fast delivery, exclusive deals, and early access to new releases', 7.99, '["Free next-day delivery","Exclusive member deals","Early access to new releases"]'::jsonb, 0)
ON CONFLICT DO NOTHING;

INSERT INTO store_navigation_menus (menu_key, label, items) VALUES
  ('secondary', 'Secondary Nav', '[
    {"label":"Books","href":"/books"},
    {"label":"Categories","href":"/categories"},
    {"label":"Deals","href":"/deals"},
    {"label":"Best Sellers","href":"/books?sort=bestseller"},
    {"label":"New Releases","href":"/books?sort=newest"}
  ]'::jsonb),
  ('mega_menu', 'Departments', '[
    {"label":"Fiction","href":"/books/fiction","children":[{"label":"Literary Fiction","href":"/books/literary-fiction"},{"label":"Mystery","href":"/books/mystery"},{"label":"Romance","href":"/books/romance"}]},
    {"label":"Non-Fiction","href":"/books/non-fiction","children":[{"label":"Biography","href":"/books/biography"},{"label":"History","href":"/books/history"},{"label":"Self-Help","href":"/books/self-help"}]},
    {"label":"Children''s Books","href":"/books/childrens"},
    {"label":"Sci-Fi & Fantasy","href":"/books/sci-fi-fantasy"}
  ]'::jsonb)
ON CONFLICT (menu_key) DO NOTHING;
