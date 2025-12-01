-- PostgreSQL/Supabase Database Setup
-- NOTE: This file uses PostgreSQL syntax, not SQL Server
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on names for faster searches
CREATE INDEX IF NOT EXISTS idx_players_first_name ON players(first_name);
CREATE INDEX IF NOT EXISTS idx_players_last_name ON players(last_name);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (read, insert, update, delete) for anonymous users
-- Note: In production, you should restrict this based on your security requirements
CREATE POLICY "Allow all operations for anonymous users" 
ON players 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Create policy for authenticated users as well
CREATE POLICY "Allow all operations for authenticated users" 
ON players 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function on every update
CREATE TRIGGER update_players_updated_at 
BEFORE UPDATE ON players 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
