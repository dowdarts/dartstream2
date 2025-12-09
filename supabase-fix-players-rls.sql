-- Fix RLS policies for players table (public scoring app)
-- and player_accounts table (authenticated personal dashboards)

-- ===========================================
-- PLAYERS TABLE - PUBLIC ACCESS
-- ===========================================
-- The players table is for the public-facing scoring app
-- Anyone can add/edit/view players in the library

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON players;
DROP POLICY IF EXISTS "Allow public insert access" ON players;
DROP POLICY IF EXISTS "Allow public update access" ON players;
DROP POLICY IF EXISTS "Allow public delete access" ON players;

-- Create policies for public access
CREATE POLICY "Allow public read access"
ON players
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert access"
ON players
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON players
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access"
ON players
FOR DELETE
TO public
USING (true);

-- ===========================================
-- GAME_STATES TABLE - PUBLIC ACCESS
-- ===========================================
-- The game_states table stores live match data for the scoring app
-- Anyone can create/read/update game states for live scoring

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON game_states;
DROP POLICY IF EXISTS "Allow public insert access" ON game_states;
DROP POLICY IF EXISTS "Allow public update access" ON game_states;
DROP POLICY IF EXISTS "Allow public delete access" ON game_states;

-- Create policies for public access
CREATE POLICY "Allow public read access"
ON game_states
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert access"
ON game_states
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON game_states
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access"
ON game_states
FOR DELETE
TO public
USING (true);

-- ===========================================
-- PLAYER_ACCOUNTS TABLE - AUTHENTICATED ACCESS
-- ===========================================
-- The player_accounts table stores user authentication and personal stats
-- Only authenticated users can view their own account
-- Linking happens via matching player_id + email between tables

-- Add account_linked_player_id column to track which player library entry is linked
-- This column will store the UUID id from the players table once linked
ALTER TABLE player_accounts 
ADD COLUMN IF NOT EXISTS account_linked_player_id UUID REFERENCES players(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_accounts_linked_player 
ON player_accounts(account_linked_player_id);

-- Note: RLS policies for player_accounts already exist from previous migration
-- Users can only view/update their own account
-- Public can verify email+player_id for linking purposes
