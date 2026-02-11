# 🚨 URGENT: Run Journal Title Migration

## The Error You're Seeing

```
Error saving entry: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'title' column of 'journal_entries' in the schema cache"}
```

## Why This Happens

The `title` column hasn't been added to the `journal_entries` table yet. You need to run the migration.

## ✅ SOLUTION: Run This Migration NOW

### Step 1: Open Supabase SQL Editor

1. Go to: **https://mirpnmrsjjmmiqbbawab.supabase.co**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run the Migration

1. Open the file: `supabase/migrations/030_add_title_to_journal_entries.sql`
2. Copy **ALL** contents:
   ```sql
   -- Add title column to journal_entries table
   ALTER TABLE public.journal_entries 
   ADD COLUMN IF NOT EXISTS title TEXT;
   ```
3. Paste into the SQL Editor
4. Click **RUN** (or press Ctrl/Cmd + Enter)
5. You should see: **"Success. No rows returned"**

### Step 3: Verify the Column Was Added

1. Go to **Table Editor** in the left sidebar
2. Click on the **journal_entries** table
3. You should now see a **title** column (TEXT type, nullable)

### Step 4: Test the App

After running the migration:
1. Go back to your app
2. Try editing a journal entry
3. Add a title and save
4. It should work now! ✅

## What This Migration Does

- Adds a `title` column (TEXT, nullable) to the `journal_entries` table
- Safe to run multiple times (uses `IF NOT EXISTS`)
- Won't affect existing data
- Takes less than 1 second to run

## Important Notes

- ⚠️ **You MUST run this migration** - The frontend code can't fix this alone
- ✅ **Safe to run multiple times** - The migration is idempotent
- ✅ **Won't affect existing data** - Only adds the new column
- ✅ **Takes 1 second** - Very quick to run
