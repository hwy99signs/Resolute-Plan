-- Journal Media Storage Policies
-- Copy and paste this entire file into Supabase SQL Editor
-- If you get permission errors, use the Dashboard UI method instead (see QUICK_POLICY_SETUP.md)

-- Policy 1: Anyone can view journal media (public bucket)
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
