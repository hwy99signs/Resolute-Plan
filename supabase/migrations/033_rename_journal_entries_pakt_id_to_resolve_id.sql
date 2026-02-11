-- Rename pakt_id to resolve_id in journal_entries table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'journal_entries' 
        AND column_name = 'pakt_id'
    ) THEN
        ALTER TABLE public.journal_entries RENAME COLUMN pakt_id TO resolve_id;
        RAISE NOTICE 'Renamed column "pakt_id" to "resolve_id" in journal_entries table';
    END IF;
END $$;

-- Update foreign key constraint
DO $$
BEGIN
    -- Drop old foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'journal_entries' 
        AND constraint_name LIKE '%pakt%'
    ) THEN
        ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pakt_id_fkey;
    END IF;
    
    -- Add new foreign key if resolve_id exists and constraint doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'journal_entries' 
        AND column_name = 'resolve_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'journal_entries' 
        AND constraint_name = 'journal_entries_resolve_id_fkey'
    ) THEN
        ALTER TABLE public.journal_entries 
        ADD CONSTRAINT journal_entries_resolve_id_fkey 
        FOREIGN KEY (resolve_id) REFERENCES public.resolves(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update index
DROP INDEX IF EXISTS public.idx_journal_entries_pakt_id;
CREATE INDEX IF NOT EXISTS idx_journal_entries_resolve_id ON public.journal_entries(resolve_id);
