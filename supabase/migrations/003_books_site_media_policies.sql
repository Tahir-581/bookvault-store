-- Tighten books-site-media for admin cover uploads (service-role writes; public reads)
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'books-site-media';

DROP POLICY IF EXISTS "Anon upload books media for seed" ON storage.objects;

DROP POLICY IF EXISTS "Public read books media" ON storage.objects;
CREATE POLICY "Public read books media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'books-site-media');

DROP POLICY IF EXISTS "Admin upload books media" ON storage.objects;
CREATE POLICY "Admin upload books media"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'books-site-media' AND books_is_admin());

DROP POLICY IF EXISTS "Admin update books media" ON storage.objects;
CREATE POLICY "Admin update books media"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'books-site-media' AND books_is_admin());

DROP POLICY IF EXISTS "Admin delete books media" ON storage.objects;
CREATE POLICY "Admin delete books media"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'books-site-media' AND books_is_admin());
