-- Backfill display ratings/reviews for books still at defaults (e.g. CSV imports).
-- Leaves already-rated books (seed data) unchanged.
UPDATE store_books
SET
  avg_rating = ROUND((4 + random())::numeric, 1),
  review_count = 50 + floor(random() * 451)::int
WHERE avg_rating = 0 AND review_count = 0;
