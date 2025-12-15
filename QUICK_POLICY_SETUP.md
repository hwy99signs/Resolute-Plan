# ⚡ Quick Policy Setup for journal-media Bucket

## Current Status
✅ Bucket `journal-media` exists  
❌ 0 policies (need to create 4 policies)

## Fast Setup (5 minutes)

### Go to Policies Tab
1. Supabase Dashboard → **Storage** → **journal-media** bucket
2. Click **Policies** tab
3. Click **New Policy** button

---

## Policy 1: Public View (SELECT)

**Settings:**
- Policy name: `Anyone can view journal media`
- Allowed operation: **SELECT**
- Target roles: **public**
- Policy definition:
  ```sql
  bucket_id = 'journal-media'
  ```

Click **Save**

---

## Policy 2: Upload (INSERT)

**Settings:**
- Policy name: `Users can upload journal media`
- Allowed operation: **INSERT**
- Target roles: **authenticated**
- Policy definition (WITH CHECK):
  ```sql
  bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
  ```

Click **Save**

---

## Policy 3: Update (UPDATE)

**Settings:**
- Policy name: `Users can update journal media`
- Allowed operation: **UPDATE**
- Target roles: **authenticated**
- Policy definition:
  - **USING:**
    ```sql
    bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
    ```
  - **WITH CHECK:**
    ```sql
    bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
    ```

Click **Save**

---

## Policy 4: Delete (DELETE)

**Settings:**
- Policy name: `Users can delete journal media`
- Allowed operation: **DELETE**
- Target roles: **authenticated**
- Policy definition (USING):
  ```sql
  bucket_id = 'journal-media' AND name LIKE auth.uid()::text || '/%'
  ```

Click **Save**

---

## Verify

After creating all 4 policies:
- Go back to **Storage** → **journal-media**
- You should see **"4"** in the Policies column
- Try uploading media in your app - it should work! ✅
