-- Add nationality column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Add index for faster nationality queries
CREATE INDEX IF NOT EXISTS idx_players_nationality ON players(nationality);
