-- Add nationality column to players table (PostgreSQL syntax for Supabase)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kswwbqumgsdissnwuiab/sql/new

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'nationality'
    ) THEN
        ALTER TABLE players ADD COLUMN nationality TEXT;
    END IF;
END $$;

-- Add index for faster nationality queries
CREATE INDEX IF NOT EXISTS idx_players_nationality ON players(nationality);
