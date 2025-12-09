-- Create match_stats table for tracking individual player performance in matches
-- This table stores stats for each player in each match

CREATE TABLE IF NOT EXISTS match_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Match identification
    match_id VARCHAR(50) NOT NULL,
    match_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Player identification (links to players table)
    player_library_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    
    -- Opponent information
    opponent_name VARCHAR(255),
    
    -- Match details
    game_type VARCHAR(50), -- '301', '501', 'custom'
    starting_score INTEGER,
    match_format VARCHAR(50), -- 'Best of 3', 'Best of 5', etc.
    
    -- Match outcome
    won BOOLEAN DEFAULT false,
    legs_won INTEGER DEFAULT 0,
    legs_lost INTEGER DEFAULT 0,
    
    -- Scoring statistics
    total_darts_thrown INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    
    -- Checkout statistics
    checkout_attempts INTEGER DEFAULT 0,
    successful_checkouts INTEGER DEFAULT 0,
    highest_checkout INTEGER DEFAULT 0,
    
    -- Averages and performance
    three_dart_average DECIMAL(5,2),
    first_nine_average DECIMAL(5,2),
    
    -- Score tracking (JSONB for flexibility)
    leg_scores JSONB DEFAULT '[]', -- Array of leg scores
    checkout_history JSONB DEFAULT '[]', -- Array of successful checkouts
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_match_stats_player 
ON match_stats(player_library_id);

CREATE INDEX IF NOT EXISTS idx_match_stats_match 
ON match_stats(match_id);

CREATE INDEX IF NOT EXISTS idx_match_stats_date 
ON match_stats(match_date DESC);

-- RLS policies for match_stats
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;

-- Public can insert match stats (from scoring app)
CREATE POLICY "Allow public insert" 
ON match_stats 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Public can read all match stats
CREATE POLICY "Allow public read" 
ON match_stats 
FOR SELECT 
TO public 
USING (true);

-- Public can update match stats
CREATE POLICY "Allow public update" 
ON match_stats 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS match_stats_updated_at ON match_stats;
CREATE TRIGGER match_stats_updated_at
    BEFORE UPDATE ON match_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_match_stats_updated_at();

-- Add match_stats column to player_accounts for aggregated stats
-- This will be updated when viewing account to show lifetime stats
ALTER TABLE player_accounts 
ADD COLUMN IF NOT EXISTS lifetime_stats JSONB DEFAULT '{
    "total_matches": 0,
    "total_wins": 0,
    "total_legs_won": 0,
    "total_legs_lost": 0,
    "total_darts_thrown": 0,
    "total_score": 0,
    "highest_checkout": 0,
    "average_3dart": 0,
    "recent_matches": []
}'::jsonb;

-- Function to update player_accounts lifetime stats from match_stats
CREATE OR REPLACE FUNCTION update_player_lifetime_stats(p_player_library_id UUID)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_stats JSONB;
BEGIN
    -- Find the user_id for this player_library_id
    SELECT user_id INTO v_user_id
    FROM player_accounts
    WHERE account_linked_player_id = p_player_library_id;
    
    IF v_user_id IS NULL THEN
        RETURN; -- No linked account
    END IF;
    
    -- Calculate aggregated stats
    SELECT jsonb_build_object(
        'total_matches', COUNT(*),
        'total_wins', SUM(CASE WHEN won THEN 1 ELSE 0 END),
        'total_legs_won', SUM(legs_won),
        'total_legs_lost', SUM(legs_lost),
        'total_darts_thrown', SUM(total_darts_thrown),
        'total_score', SUM(total_score),
        'highest_checkout', MAX(highest_checkout),
        'average_3dart', ROUND(AVG(three_dart_average), 2),
        'recent_matches', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', match_date,
                    'opponent', opponent_name,
                    'won', won,
                    'score', legs_won || '-' || legs_lost,
                    'average', three_dart_average
                )
                ORDER BY match_date DESC
            )
            FROM (
                SELECT * FROM match_stats 
                WHERE player_library_id = p_player_library_id 
                ORDER BY match_date DESC 
                LIMIT 10
            ) recent
        )
    ) INTO v_stats
    FROM match_stats
    WHERE player_library_id = p_player_library_id;
    
    -- Update player_accounts
    UPDATE player_accounts
    SET lifetime_stats = v_stats,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
END;
$$ LANGUAGE plpgsql;
