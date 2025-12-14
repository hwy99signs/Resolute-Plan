# 📋 Create Journal Media Policies via Supabase Dashboard

## If SQL Migration Fails with Permission Error

If you get "permission denied for schema storage" when running the migration, create the policies manually via the Dashboard.

## Step-by-Step: Create Policies via UI

### Prerequisites
1. ✅ Bucket `journal-media` must exist (create it first if needed)
2. ✅ Helper function `storage.user_owns_journal_media` should exist (from migration)

### Step 1: Navigate to Storage Policies

1. Go to: **https://mirpnmrsjjmmiqbbawab.supabase.co**
2. Click **Storage** in the left sidebar
3. Click on the **journal-media** bucket
4. Click the **Policies** tab

### Step 2: Create Policy 1 - Public View Access

1. Click **New Policy**
2. Policy name: `Anyone can view journal media`
3. Allowed operation: **SELECT**
4. Target roles: **public**
5. Policy definition (USING expression):
   ```sql
   bucket_id = 'journal-media'
   ```
6. Click **Review** → **Save policy**

### Step 3: Create Policy 2 - Upload Access

1. Click **New Policy**
2. Policy name: `Users can upload journal media`
3. Allowed operation: **INSERT**
4. Target roles: **authenticated**
5. Policy definition (WITH CHECK expression):
   ```sql
   bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
   ```
6. Click **Review** → **Save policy**

### Step 4: Create Policy 3 - Update Access

1. Click **New Policy**
2. Policy name: `Users can update journal media`
3. Allowed operation: **UPDATE**
4. Target roles: **authenticated**
5. Policy definition:
   - **USING expression:**
     ```sql
     bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
     ```
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
     ```
6. Click **Review** → **Save policy**

### Step 5: Create Policy 4 - Delete Access

1. Click **New Policy**
2. Policy name: `Users can delete journal media`
3. Allowed operation: **DELETE**
4. Target roles: **authenticated**
5. Policy definition (USING expression):
   ```sql
   bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
   ```
6. Click **Review** → **Save policy**

## Verification

After creating all policies:

1. Go to **Storage** → **journal-media** → **Policies**
2. You should see 4 policies:
   - ✅ Anyone can view journal media (SELECT, public)
   - ✅ Users can upload journal media (INSERT, authenticated)
   - ✅ Users can update journal media (UPDATE, authenticated)
   - ✅ Users can delete journal media (DELETE, authenticated)

## Test It

1. Try uploading media to a journal entry in your app
2. Should work without permission errors!

## What Each Policy Does

- **View Policy**: Allows anyone to view/download media files
- **Upload Policy**: Allows authenticated users to upload files to paths starting with their user ID
- **Update Policy**: Allows users to update their own files
- **Delete Policy**: Allows users to delete their own files

## File Path Format

Files are stored as: `{userId}/{entryId}/{timestamp}_{filename}`

Example: `123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/1703123456789_photo.jpg`

The policy checks that the file path starts with the user's ID.
