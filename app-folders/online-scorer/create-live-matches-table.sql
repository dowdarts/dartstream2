-- Create live_matches table for online darts scoring
-- Run this migration in Supabase SQL editor to enable online match functionality

CREATE TABLE IF NOT EXISTS live_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code TEXT UNIQUE NOT NULL,
    host_name TEXT NOT NULL,
    guest_name TEXT,
    game_type TEXT DEFAULT '501',  -- '501' or '301'
    start_type TEXT DEFAULT 'SI',  -- 'SI' (Single In) or 'DI' (Double In)
    current_turn TEXT DEFAULT 'host',  -- 'host' or 'guest'
    scores JSONB DEFAULT '{
        "host": 501,
        "guest": 501,
        "host_leg_avg": 0,
        "guest_leg_avg": 0,
        "host_match_avg": 0,
        "guest_match_avg": 0,
        "host_legs_won": 0,
        "guest_legs_won": 0,
        "host_darts_thrown": 0,
        "guest_darts_thrown": 0,
        "score_history": []
    }'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    last_updated_by TEXT
);

-- Create index on room_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_live_matches_room_code ON live_matches(room_code);
CREATE INDEX IF NOT EXISTS idx_live_matches_is_active ON live_matches(is_active);

-- Create RLS policies for public access (no authentication required for online play)
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read active matches
CREATE POLICY live_matches_read ON live_matches
    FOR SELECT USING (is_active = true);

-- Policy: Allow anyone to insert new matches
CREATE POLICY live_matches_insert ON live_matches
    FOR INSERT WITH CHECK (true);

-- Policy: Allow anyone to update matches
CREATE POLICY live_matches_update ON live_matches
    FOR UPDATE USING (true);

-- Create trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_matches_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_live_matches_timestamp_trigger ON live_matches;
CREATE TRIGGER update_live_matches_timestamp_trigger
BEFORE UPDATE ON live_matches
FOR EACH ROW
EXECUTE FUNCTION update_live_matches_timestamp();

-- Create trigger to auto-expire inactive matches after 2 hours
CREATE OR REPLACE FUNCTION expire_inactive_matches()
RETURNS void AS $$
BEGIN
    UPDATE live_matches
    SET is_active = false
    WHERE is_active = true
    AND (now() - updated_at) > interval '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Note: Call expire_inactive_matches() periodically via a cron job
-- or call it manually when needed: SELECT expire_inactive_matches();
