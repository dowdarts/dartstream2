-- Add lifetime_stats column to player_accounts table
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
