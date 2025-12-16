// Supabase Configuration
console.log('supabase-config.js loading...');

const SUPABASE_URL = 'https://kswwbqumgsdissnwuiab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnd1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODMwNTIsImV4cCI6MjA4MDA1OTA1Mn0.b-z8JqL1dBYJcrrzSt7u6VAaFAtTOl1vqqtFFgHkJ50';

// Initialize Supabase client
function getSupabaseClient() {
    if (!window.supabaseClient) {
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.error('Supabase library not loaded yet');
            return null;
        }
        try {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized');
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    }
    return window.supabaseClient;
}

// Make supabase client globally available
window.supabase = window.supabaseClient || supabase;
