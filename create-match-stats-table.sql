-- Create match_stats table for tracking individual player performance in matches
CREATE TABLE IF NOT EXISTS match_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Match identification
    match_id VARCHAR(50) NOT NULL,
    match_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Player identification (links to players table)
    player_library_id UUID REFERENCES players(id) ON DELETE CASCADE,
    opponent_name VARCHAR(255),
    
    -- Match outcome
    won BOOLEAN DEFAULT false,
    legs_won INTEGER DEFAULT 0,
    legs_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    
    -- Scoring statistics
    total_darts_thrown INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_3dart DECIMAL(5,2),
    first_9_average DECIMAL(5,2),
    highest_checkout INTEGER DEFAULT 0,
    checkout_percentage DECIMAL(5,2),
    
    -- Score tracking (JSONB for flexibility)
    leg_scores JSONB DEFAULT '[]',
    checkout_history JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON match_stats(player_library_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_date ON match_stats(match_date DESC);

-- Enable RLS
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow public access for scoring app
CREATE POLICY "Allow public insert" ON match_stats FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public read" ON match_stats FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update" ON match_stats FOR UPDATE TO public USING (true) WITH CHECK (true);

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
        'average_3dart', ROUND(AVG(average_3dart), 2),
        'recent_matches', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', match_date,
                    'opponent', opponent_name,
                    'won', won,
                    'score', legs_won || '-' || legs_lost,
                    'average', average_3dart
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
