// Tournament Portal Configuration
// This file handles the Supabase connection for the tournament system

const SUPABASE_URL = 'https://kswwbqumgsdissnwuiab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbn d1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0Mjg3ODksImV4cCI6MjA0NzAwNDc4OX0.lfzJu0H0w2qkDYGC6cAd8aLlRRsHJI4bsAGN_QNxiIo';

// Initialize Supabase client for tournament features
let tournamentSupabase = null;

function getTournamentSupabaseClient() {
    if (!tournamentSupabase) {
        try {
            if (typeof supabase === 'undefined' || !supabase.createClient) {
                console.error('Supabase library not loaded');
                return null;
            }
            
            tournamentSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Tournament Supabase client initialized successfully');
        } catch (error) {
            console.error('Error creating tournament Supabase client:', error);
            return null;
        }
    }
    return tournamentSupabase;
}

// Database table names
const TABLES = {
    PLAYERS: 'players',
    TOURNAMENTS: 'tournaments',
    TOURNAMENT_PLAYERS: 'tournament_players',
    MATCHES: 'tournament_matches',
    TOURNAMENT_STATS: 'tournament_stats',
    GLOBAL_STATS: 'stats_global',
    BOARDS: 'tournament_boards'
};

// Tournament status constants
const TOURNAMENT_STATUS = {
    SETUP: 'setup',
    ROUND_ROBIN: 'round_robin',
    KNOCKOUT: 'knockout',
    COMPLETE: 'complete'
};

// Match status constants
const MATCH_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETE: 'complete'
};

// Match stages
const MATCH_STAGE = {
    ROUND_ROBIN: 'RR',
    QUARTER_FINAL: 'QF',
    SEMI_FINAL: 'SF',
    FINAL: 'F'
};

// Scoring methods
const SCORING_METHOD = {
    MATCH_WIN: 'MATCH_WIN',
    POINT_PER_LEG: 'POINT_PER_LEG'
};
