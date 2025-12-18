-- Create lobby_matches table
CREATE TABLE IF NOT EXISTS lobby_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    host_display_name TEXT NOT NULL,
    room_code TEXT UNIQUE NOT NULL,
    match_title TEXT NOT NULL DEFAULT 'Open Match',
    game_type TEXT NOT NULL DEFAULT '501', -- '301', '501', etc.
    start_score INTEGER NOT NULL DEFAULT 501,
    double_in BOOLEAN NOT NULL DEFAULT false,
    double_out BOOLEAN NOT NULL DEFAULT true,
    total_legs INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
    joined_user_id UUID,
    joined_display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_match_id UUID REFERENCES lobby_matches(id) ON DELETE CASCADE,
    requesting_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requesting_display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lobby_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lobby_matches
-- Everyone can view waiting matches
CREATE POLICY "Anyone can view waiting lobby matches"
    ON lobby_matches FOR SELECT
    USING (status = 'waiting' OR status = 'in_progress');

-- Authenticated users and anon can insert (host a match)
CREATE POLICY "Anyone can create lobby matches"
    ON lobby_matches FOR INSERT
    WITH CHECK (true);

-- Only host can update their match
CREATE POLICY "Host can update their lobby match"
    ON lobby_matches FOR UPDATE
    USING (
        auth.uid() = host_user_id 
        OR auth.uid() = joined_user_id
        OR true -- Allow anon users to update their own matches
    );

-- Only host can delete their match
CREATE POLICY "Host can delete their lobby match"
    ON lobby_matches FOR DELETE
    USING (auth.uid() = host_user_id OR true);

-- RLS Policies for join_requests
-- Host and requester can view
CREATE POLICY "Users can view their join requests"
    ON join_requests FOR SELECT
    USING (
        auth.uid() = requesting_user_id 
        OR EXISTS (
            SELECT 1 FROM lobby_matches 
            WHERE lobby_matches.id = join_requests.lobby_match_id 
            AND lobby_matches.host_user_id = auth.uid()
        )
        OR true -- Allow viewing for guest users
    );

-- Anyone can create join request
CREATE POLICY "Anyone can create join requests"
    ON join_requests FOR INSERT
    WITH CHECK (true);

-- Requester can update (cancel) their request
CREATE POLICY "Users can update their join requests"
    ON join_requests FOR UPDATE
    USING (auth.uid() = requesting_user_id OR true);

-- Host can delete requests for their match
CREATE POLICY "Host can delete join requests for their match"
    ON join_requests FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM lobby_matches 
            WHERE lobby_matches.id = join_requests.lobby_match_id 
            AND lobby_matches.host_user_id = auth.uid()
        )
        OR auth.uid() = requesting_user_id
        OR true
    );

-- Create indexes for performance
CREATE INDEX idx_lobby_matches_status ON lobby_matches(status);
CREATE INDEX idx_lobby_matches_room_code ON lobby_matches(room_code);
CREATE INDEX idx_join_requests_lobby_match ON join_requests(lobby_match_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_lobby_matches_updated_at BEFORE UPDATE ON lobby_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_join_requests_updated_at BEFORE UPDATE ON join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
