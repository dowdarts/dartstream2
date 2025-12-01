// Supabase Configuration
console.log('supabase-config.js loading...');

const SUPABASE_URL = 'https://namwnoscgymzuiiebxvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbXdub3NjZ3ltenVpaWVieHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDg0NjQsImV4cCI6MjA3ODI4NDQ2NH0.uoz9L_nE-VZylXJvJNStdh5c4Ep7fUuwg0EWVCvkql0';

// Initialize Supabase client
function getSupabaseClient() {
    if (!window.supabaseClient) {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded');
            return null;
        }
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
    }
    return window.supabaseClient;
}

// Player Library Database Functions
const PlayerDB = {
    // Fetch all players from database
    async getAllPlayers() {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                console.error('Supabase client not available');
                return [];
            }
            
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .order('first_name', { ascending: true });
            
            if (error) throw error;
            
            console.log('Fetched players from Supabase:', data);
            
            return data.map(player => ({
                id: player.id,
                firstName: player.first_name,
                lastName: player.last_name,
                createdAt: player.created_at
            }));
        } catch (error) {
            console.error('Error fetching players:', error);
            return [];
        }
    },

    // Add a new player
    async addPlayer(firstName, lastName) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            console.log('Adding player:', firstName, lastName);
            
            const { data, error } = await supabase
                .from('players')
                .insert([
                    { 
                        first_name: firstName,
                        last_name: lastName
                    }
                ])
                .select();
            
            console.log('Insert result:', { data, error });
            
            if (error) throw error;
            
            return {
                id: data[0].id,
                firstName: data[0].first_name,
                lastName: data[0].last_name,
                createdAt: data[0].created_at
            };
        } catch (error) {
            console.error('Error adding player:', error);
            console.error('Error details:', error.message, error.code);
            throw error;
        }
    },

    // Update a player
    async updatePlayer(id, firstName, lastName) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await supabase
                .from('players')
                .update({ 
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            return {
                id: data[0].id,
                firstName: data[0].first_name,
                lastName: data[0].last_name,
                createdAt: data[0].created_at
            };
        } catch (error) {
            console.error('Error updating player:', error);
            throw error;
        }
    },

    // Delete a single player
    async deletePlayer(id) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Error deleting player:', error);
            throw error;
        }
    },

    // Delete multiple players
    async deletePlayers(ids) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            console.log('Deleting players with IDs:', ids);
            
            const { data, error } = await supabase
                .from('players')
                .delete()
                .in('id', ids)
                .select();
            
            console.log('Delete result:', { data, error });
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Error deleting players:', error);
            throw error;
        }
    }
};

// Make PlayerDB available globally for ES6 modules
window.PlayerDB = PlayerDB;
window.supabaseConfigReady = true;
console.log('PlayerDB registered on window object');
console.log('window.PlayerDB:', window.PlayerDB);
