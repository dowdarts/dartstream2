-- Database setup for Dartstream2 scoring app
-- Run this in Supabase SQL Editor if the game_states table doesn't exist

-- Create game_states table
CREATE TABLE IF NOT EXISTS game_states (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    game_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on game_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_states_game_id ON game_states(game_id);

-- Enable Row Level Security (RLS)
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon users (for demo/development)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations for anon users" ON game_states
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;

-- Note: After running this, make sure to enable Realtime in Supabase dashboard:
-- 1. Go to Database > Replication
-- 2. Find 'game_states' table
-- 3. Toggle Realtime ON
