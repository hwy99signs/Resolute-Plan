# 🔧 Journal Media Upload Permission Fix

## The Error

```
Error uploading media: Permission denied. Please check storage policies in Supabase.
```

## Why This Happens

The storage bucket `journal-media` either:
1. Doesn't exist yet (needs to be created manually)
2. Exists but policies aren't set up correctly
3. Policies exist but the file path format doesn't match

## ✅ SOLUTION: Follow These Steps

### Step 1: Create the Storage Bucket (REQUIRED FIRST)

**You MUST create the bucket manually in Supabase Dashboard:**

1. Go to: **https://mirpnmrsjjmmiqbbawab.supabase.co**
2. Click **Storage** in the left sidebar
3. Click **New Bucket** button
4. Fill in:
   - **Name**: `journal-media`
   - **Public bucket**: ✅ **Check this** (important!)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `image/webp`
     - `image/gif`
     - `video/mp4`
     - `video/quicktime`
     - `video/x-msvideo`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `text/plain`
     - `text/csv`
5. Click **Create**

### Step 2: Run the SQL Migration

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file: `supabase/migrations/032_create_journal_media_bucket.sql`
4. Copy **ALL** contents and paste into the SQL Editor
5. Click **RUN** (or press Ctrl/Cmd + Enter)
6. You should see: **"Success. No rows returned"** OR a notice about creating policies via Dashboard

**If you get "permission denied for schema storage" error:**
- The helper function will still be created
- You need to create policies via Dashboard instead
- See `JOURNAL_MEDIA_POLICIES_UI.md` for step-by-step instructions

### Step 3: Create Policies (If SQL Failed)

**If the SQL migration showed a notice about creating policies via Dashboard:**

1. Follow the instructions in `JOURNAL_MEDIA_POLICIES_UI.md`
2. Create all 4 policies via the Dashboard UI
3. This is the recommended method if you get permission errors

### Step 4: Verify the Setup

1. **Check bucket exists:**
   - Go to **Storage**
   - You should see "journal-media" bucket listed

2. **Check policies:**
   - Go to **Storage** → **journal-media** → **Policies** tab
   - You should see 4 policies:
     - "Users can upload journal media"
     - "Users can update journal media"
     - "Users can delete journal media"
     - "Anyone can view journal media"

3. **Test upload:**
   - Try adding media to a journal entry in your app
   - Should work without permission errors!

## What the Policies Do

- **Upload Policy**: Allows authenticated users to upload files to paths starting with their user ID
- **Update Policy**: Allows users to update their own files
- **Delete Policy**: Allows users to delete their own files
- **View Policy**: Allows anyone (public) to view files in the bucket

## File Path Format

Files are stored as: `{userId}/{entryId}/{timestamp}_{filename}`

Example: `123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/1703123456789_photo.jpg`

The policy checks that the file path starts with the user's ID, ensuring users can only upload to their own folders.

## Troubleshooting

If you still get permission errors after following the steps:

1. **Check bucket is public:**
   - Storage → journal-media → Settings
   - "Public bucket" should be ON

2. **Check policies are active:**
   - Storage → journal-media → Policies
   - All 4 policies should be listed and enabled

3. **Check user is authenticated:**
   - Make sure you're logged in to the app
   - Check browser console for auth errors

4. **Try recreating policies:**
   - Delete all policies in the bucket
   - Re-run the migration SQL
