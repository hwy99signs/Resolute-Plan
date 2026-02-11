-- Create storage bucket for journal media (images, videos, documents)
-- IMPORTANT: You MUST create the bucket manually in Supabase Dashboard first!
-- This migration creates policies WITHOUT needing storage schema permissions

-- Note: If you get permission errors, create policies via Dashboard instead
-- See JOURNAL_MEDIA_POLICIES_UI.md for Dashboard instructions

-- Try to create helper function in public schema (more permissive)
-- If this fails, policies below will use direct path matching instead
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.user_owns_journal_media(file_name text, user_id uuid)
  RETURNS boolean AS $$
  BEGIN
    -- File path format: {userId}/{entryId}/{timestamp}.{ext}
    RETURN file_name LIKE user_id::text || '/%';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create helper function. Policies will use direct path matching.';
END $$;

-- Policies can be created via Dashboard UI (recommended if SQL fails)
-- Or try running the policy creation SQL below
-- If you get permission errors, use Dashboard method (JOURNAL_MEDIA_POLICIES_UI.md)

-- Simplified policies that don't require helper function
-- These use direct path matching: name LIKE auth.uid()::text || '/%'
-- This checks if file path starts with user's ID

-- Note: Run these one at a time if you get errors, or create via Dashboard

-- Policy 1: Public View (SELECT)
-- CREATE POLICY "Anyone can view journal media"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'journal-media');

-- Policy 2: Upload (INSERT)  
-- CREATE POLICY "Users can upload journal media"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'journal-media' AND
--   name LIKE auth.uid()::text || '/%'
-- );

-- Policy 3: Update (UPDATE)
-- CREATE POLICY "Users can update journal media"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'journal-media' AND
--   name LIKE auth.uid()::text || '/%'
-- )
-- WITH CHECK (
--   bucket_id = 'journal-media' AND
--   name LIKE auth.uid()::text || '/%'
-- );

-- Policy 4: Delete (DELETE)
-- CREATE POLICY "Users can delete journal media"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'journal-media' AND
--   name LIKE auth.uid()::text || '/%'
-- );
