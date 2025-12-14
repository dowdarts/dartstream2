-- Create game_rooms table for Play Online feature
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(4) UNIQUE NOT NULL,
    host_id UUID, -- Can be auth user or locally-generated guest ID
    guest_id UUID, -- Can be auth user or locally-generated guest ID
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
    USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can update their rooms" ON game_rooms
    FOR UPDATE TO authenticated
    USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can delete their rooms" ON game_rooms
    FOR DELETE TO authenticated
    USING (auth.uid() = host_id);

-- Enable pg_cron extension for scheduled cleanup jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to clean up inactive rooms (not updated for 1 minute)
-- WITH SECURE search_path to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.cleanup_inactive_rooms()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
    DELETE FROM public.game_rooms
    WHERE status != 'active'
    AND updated_at < pg_catalog.NOW() - INTERVAL '1 minute';
END;
$$;

-- Schedule cleanup to run every 30 seconds
SELECT cron.schedule('cleanup-inactive-rooms', '30 seconds', 'SELECT cleanup_inactive_rooms()');

-- Enable Realtime for game_rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

COMMENT ON TABLE game_rooms IS 'Stores online multiplayer game room sessions for VideoStream feature';
