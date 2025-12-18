-- Fix RLS policies for game_rooms to allow join requests
-- This allows guests to update matches with their pending_guest_id

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable update for authenticated users" ON game_rooms;
DROP POLICY IF EXISTS "Enable update for match participants" ON game_rooms;
DROP POLICY IF EXISTS "Allow users to update their hosted matches" ON game_rooms;
DROP POLICY IF EXISTS "Allow users to send join requests" ON game_rooms;

-- Allow hosts to update their own matches
CREATE POLICY "Allow hosts to update their matches"
ON game_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = host_id);

-- Allow any authenticated user to send join requests (update pending_guest fields)
CREATE POLICY "Allow join requests from authenticated users"
ON game_rooms
FOR UPDATE
TO authenticated
USING (
    -- Match is in waiting status (accepting join requests)
    status = 'waiting' 
    AND guest_id IS NULL
    -- No one else has a pending request
    AND (game_state->>'pending_guest_id') IS NULL
)
WITH CHECK (
    -- Can only update to pending status with their own user ID
    status = 'pending'
    AND (game_state->>'pending_guest_id')::uuid = auth.uid()
);

-- Allow guests to join matches they've been accepted to
CREATE POLICY "Allow guests to update accepted matches"
ON game_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = guest_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'game_rooms'
ORDER BY policyname;
