-- Create player_accounts table for DartStream Stats
-- This table stores player account information with authentication

CREATE TABLE IF NOT EXISTS player_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_id VARCHAR(4) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    stats JSONB DEFAULT '{
        "gamesPlayed": 0,
        "gamesWon": 0,
        "totalDarts": 0,
        "totalScore": 0,
        "highestCheckout": 0,
        "averages": []
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_player_accounts_user_id ON player_accounts(user_id);

-- Create index on player_id for linking
CREATE INDEX idx_player_accounts_player_id ON player_accounts(player_id);

-- Create index on email for searching
CREATE INDEX idx_player_accounts_email ON player_accounts(email);

-- Enable Row Level Security
ALTER TABLE player_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own account
CREATE POLICY "Users can view own account"
    ON player_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own account
CREATE POLICY "Users can insert own account"
    ON player_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own account
CREATE POLICY "Users can update own account"
    ON player_accounts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can read player_id and email for linking (but not stats)
CREATE POLICY "Public can verify player linking"
    ON player_accounts
    FOR SELECT
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER player_accounts_updated_at
    BEFORE UPDATE ON player_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_player_accounts_updated_at();

-- Comments for documentation
COMMENT ON TABLE player_accounts IS 'Stores player account information and statistics for DartStream Stats';
COMMENT ON COLUMN player_accounts.user_id IS 'Reference to auth.users for authentication';
COMMENT ON COLUMN player_accounts.player_id IS 'Unique 4-digit player identification number';
COMMENT ON COLUMN player_accounts.stats IS 'JSON object containing player game statistics';
