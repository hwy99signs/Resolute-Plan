-- Add media column to journal_entries table
-- Media is stored as JSONB array: [{"type": "image|video|document", "url": "...", "name": "..."}]
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Create index for media queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_media ON public.journal_entries USING GIN (media);
