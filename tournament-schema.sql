-- Tournament Portal Database Schema
-- This migration creates all necessary tables for the tournament system

-- Global Players Table
CREATE TABLE IF NOT EXISTS tournament_players_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID,
    CONSTRAINT username_min_length CHECK (char_length(username) >= 2)
);

-- Global Player Statistics
CREATE TABLE IF NOT EXISTS stats_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES tournament_players_global(id) ON DELETE CASCADE,
    total_darts INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    total_180s INTEGER DEFAULT 0,
    total_140s INTEGER DEFAULT 0,
    total_100s INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_player_stats UNIQUE (player_id)
);

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'setup',
    director_id UUID,
    scoring_method TEXT NOT NULL DEFAULT 'MATCH_WIN',
    game_format TEXT DEFAULT '501',
    num_boards INTEGER DEFAULT 2,
    num_groups INTEGER DEFAULT 2,
    players_advancing INTEGER DEFAULT 2,
    tie_breaker_priority JSONB DEFAULT '["points", "legs_won", "head_to_head", "average"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('setup', 'round_robin', 'knockout', 'complete')),
    CONSTRAINT valid_scoring_method CHECK (scoring_method IN ('MATCH_WIN', 'POINT_PER_LEG')),
    CONSTRAINT valid_num_boards CHECK (num_boards > 0 AND num_boards <= 99),
    CONSTRAINT valid_num_groups CHECK (num_groups > 0 AND num_groups <= 8),
    CONSTRAINT valid_players_advancing CHECK (players_advancing > 0 AND players_advancing <= 8)
);

-- Tournament Boards (Tracks each physical board/tablet with connection codes)
CREATE TABLE IF NOT EXISTS tournament_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    board_number INTEGER NOT NULL,
    board_name TEXT NOT NULL,
    connection_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tournament_board UNIQUE (tournament_id, board_number)
);

-- Tournament Players (Links players to specific tournament and group)
CREATE TABLE IF NOT EXISTS tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES tournament_players_global(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    seed INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tournament_player UNIQUE (tournament_id, player_id),
    CONSTRAINT valid_group CHECK (group_name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'))
);

-- Tournament Matches
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL,
    player1_id UUID NOT NULL REFERENCES tournament_players_global(id),
    player2_id UUID NOT NULL REFERENCES tournament_players_global(id),
    stage TEXT NOT NULL,
    group_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    winner_id UUID REFERENCES tournament_players_global(id),
    player1_legs INTEGER DEFAULT 0,
    player2_legs INTEGER DEFAULT 0,
    leg_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_stage CHECK (stage IN ('RR', 'QF', 'SF', 'F')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'complete')),
    CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- Tournament Statistics (Running totals per tournament)
CREATE TABLE IF NOT EXISTS tournament_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES tournament_players_global(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    legs_won INTEGER DEFAULT 0,
    legs_lost INTEGER DEFAULT 0,
    darts_thrown INTEGER DEFAULT 0,
    score_thrown INTEGER DEFAULT 0,
    total_180s INTEGER DEFAULT 0,
    total_140s INTEGER DEFAULT 0,
    total_100s INTEGER DEFAULT 0,
    manual_ranking INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tournament_player_stats UNIQUE (tournament_id, player_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_board ON tournament_matches(board_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_stats_tournament ON tournament_stats(tournament_id);
CREATE INDEX IF NOT EXISTS idx_stats_global_player ON stats_global(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_boards_code ON tournament_boards(connection_code);
CREATE INDEX IF NOT EXISTS idx_tournament_boards_tournament ON tournament_boards(tournament_id);

-- Leaderboard View (Calculated Stats)
CREATE OR REPLACE VIEW tournament_leaderboard AS
SELECT 
    ts.tournament_id,
    ts.player_id,
    p.username,
    tp.group_name,
    ts.points,
    ts.matches_won,
    ts.matches_lost,
    ts.legs_won,
    ts.legs_lost,
    ts.legs_won - ts.legs_lost as leg_difference,
    CASE 
        WHEN ts.darts_thrown > 0 THEN ROUND((ts.score_thrown::decimal / (ts.darts_thrown::decimal / 3)), 2)
        ELSE 0
    END as tournament_average,
    ts.total_180s,
    ts.total_140s,
    ts.total_100s
FROM tournament_stats ts
JOIN tournament_players_global p ON ts.player_id = p.id
JOIN tournament_players tp ON ts.tournament_id = tp.tournament_id AND ts.player_id = tp.player_id;

-- Global Leaderboard View
CREATE OR REPLACE VIEW global_leaderboard AS
SELECT 
    sg.player_id,
    p.username,
    CASE 
        WHEN sg.total_darts > 0 THEN ROUND((sg.total_score::decimal / (sg.total_darts::decimal / 3)), 2)
        ELSE 0
    END as global_average,
    sg.matches_played,
    sg.matches_won,
    sg.total_180s,
    sg.total_140s,
    sg.total_100s
FROM stats_global sg
JOIN tournament_players_global p ON sg.player_id = p.id
WHERE p.is_active = true
ORDER BY global_average DESC;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE tournament_players_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_boards ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to all tables (adjust based on your security requirements)
CREATE POLICY "Allow anonymous read access" ON tournament_players_global FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON stats_global FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON tournament_players FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON tournament_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON tournament_boards FOR SELECT USING (true);

-- Allow anonymous insert/update for tournament operations
CREATE POLICY "Allow anonymous insert" ON tournament_players_global FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tournament_players_global FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert" ON stats_global FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON stats_global FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert" ON tournament_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON tournament_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tournament_matches FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert" ON tournament_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tournament_stats FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert" ON tournament_boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tournament_boards FOR UPDATE USING (true);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_matches_updated_at BEFORE UPDATE ON tournament_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_stats_updated_at BEFORE UPDATE ON tournament_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stats_global_updated_at BEFORE UPDATE ON stats_global FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize tournament stats for a player
CREATE OR REPLACE FUNCTION initialize_tournament_stats(p_tournament_id UUID, p_player_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO tournament_stats (tournament_id, player_id)
    VALUES (p_tournament_id, p_player_id)
    ON CONFLICT (tournament_id, player_id) DO NOTHING;
    
    INSERT INTO stats_global (player_id)
    VALUES (p_player_id)
    ON CONFLICT (player_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tournament_players_global IS 'Global player registry - created by tournament directors';
COMMENT ON TABLE stats_global IS 'Lifetime aggregate statistics for each player across all tournaments';
COMMENT ON TABLE tournaments IS 'Tournament metadata and configuration settings';
COMMENT ON TABLE tournament_players IS 'Links players to specific tournaments with group assignments';
COMMENT ON TABLE tournament_matches IS 'Complete match schedule and results';
COMMENT ON TABLE tournament_stats IS 'Running totals for each player within a specific tournament';
COMMENT ON VIEW tournament_leaderboard IS 'Real-time calculated tournament standings with averages';
COMMENT ON VIEW global_leaderboard IS 'Global player rankings based on lifetime statistics';
