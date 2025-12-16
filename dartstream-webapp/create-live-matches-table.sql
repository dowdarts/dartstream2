-- Create live_matches table for online scoring synchronization
CREATE TABLE IF NOT EXISTS public.live_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL UNIQUE,
    host_name TEXT NOT NULL DEFAULT 'Home',
    guest_name TEXT,
    game_type TEXT NOT NULL DEFAULT '501',  -- '501' or '301'
    start_type TEXT NOT NULL DEFAULT 'SI',  -- 'SI' for Straight In, 'DI' for Double In
    current_turn TEXT NOT NULL DEFAULT 'host',  -- 'host' or 'guest'
    scores JSONB NOT NULL DEFAULT '{
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
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT  -- 'host' or 'guest' to track who last updated
);

-- Create index on room_code for fast lookups
CREATE INDEX idx_live_matches_room_code ON public.live_matches(room_code);
CREATE INDEX idx_live_matches_is_active ON public.live_matches(is_active);

-- Enable RLS
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active matches (for joining)
CREATE POLICY "Anyone can read active matches"
ON public.live_matches
FOR SELECT
USING (is_active = true);

-- Policy: Anyone can insert a new match (host creation)
CREATE POLICY "Anyone can create a match"
ON public.live_matches
FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update a match
CREATE POLICY "Anyone can update a match"
ON public.live_matches
FOR UPDATE
USING (is_active = true)
WITH CHECK (is_active = true);

-- Trigger: Update last_updated timestamp
CREATE OR REPLACE FUNCTION update_live_matches_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_live_matches_timestamp ON public.live_matches;
CREATE TRIGGER trigger_update_live_matches_timestamp
BEFORE UPDATE ON public.live_matches
FOR EACH ROW
EXECUTE FUNCTION update_live_matches_timestamp();

-- Trigger: Auto-expire matches that haven't been updated in 1 hour
CREATE OR REPLACE FUNCTION expire_inactive_matches()
RETURNS void AS $$
BEGIN
    UPDATE public.live_matches
    SET is_active = false
    WHERE is_active = true
    AND last_updated < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
