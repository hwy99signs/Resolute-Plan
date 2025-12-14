-- ============================================
-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ============================================
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Paste everything below and click RUN
-- ============================================

-- Policy 1: Anyone can view journal media
CREATE POLICY "Anyone can view journal media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'journal-media');

-- Policy 2: Users can upload journal media
CREATE POLICY "Users can upload journal media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-media' AND
  name LIKE auth.uid()::text || '/%'
);

-- Policy 3: Users can update their own journal media
CREATE POLICY "Users can update journal media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-media' AND
  name LIKE auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'journal-media' AND
  name LIKE auth.uid()::text || '/%'
);

-- Policy 4: Users can delete their own journal media
CREATE POLICY "Users can delete journal media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-media' AND
  name LIKE auth.uid()::text || '/%'
);

-- ============================================
-- DONE! Check Storage > journal-media > Policies
-- You should see 4 policies listed
-- ============================================
