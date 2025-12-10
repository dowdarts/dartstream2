-- Create game_rooms table for Play Online feature
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(4) UNIQUE NOT NULL,
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
    current_turn VARCHAR(10) DEFAULT 'host', -- 'host' or 'guest'
    game_state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster room code lookups
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_id);

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create rooms" ON game_rooms
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can view their rooms" ON game_rooms
    FOR SELECT TO authenticated
    USING (
        auth.uid() = host_id 
        OR auth.uid() = guest_id 
        OR status = 'waiting'  -- Allow anyone to see waiting rooms
    );

CREATE POLICY "Users can update their rooms" ON game_rooms
    FOR UPDATE TO authenticated
    USING (auth.uid() = host_id OR auth.uid() = guest_id OR status = 'waiting');

CREATE POLICY "Users can delete their rooms" ON game_rooms
    FOR DELETE TO authenticated
    USING (auth.uid() = host_id);

-- Function to clean up old waiting rooms (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM game_rooms
    WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for game_rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

COMMENT ON TABLE game_rooms IS 'Stores online multiplayer game room sessions for VideoStream feature';
