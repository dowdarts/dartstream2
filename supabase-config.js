// Supabase Configuration
console.log('supabase-config.js loading...');

const SUPABASE_URL = 'https://kswwbqumgsdissnwuiab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnd1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODMwNTIsImV4cCI6MjA4MDA1OTA1Mn0.b-z8JqL1dBYJcrrzSt7u6VAaFAtTOl1vqqtFFgHkJ50';

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

// ===== GAME STATE SYNC FOR SCOREBOARD =====

let currentMatchId = null;
let currentConnectionCode = null;

// Game State Sync Functions
const GameStateSync = {
    // Generate unique 4-digit connection code
    generateConnectionCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    // Get current connection code
    getConnectionCode() {
        return currentConnectionCode;
    },

    // Start a new match (generate new code)
    startNewMatch() {
        currentConnectionCode = this.generateConnectionCode();
        currentMatchId = 'match_' + currentConnectionCode + '_' + Date.now();
        console.log('🎯 New match started with code:', currentConnectionCode);
        return currentConnectionCode;
    },

    // End match (clear match ID and code)
    endMatch() {
        currentMatchId = null;
        currentConnectionCode = null;
        console.log('🏁 Match ended');
    },

    // Sync game state to Supabase for scoreboard
    async syncGameState(state) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                console.log('⚠️ Supabase not connected, skipping sync');
                return;
            }

            // Only sync if we have a connection code (startNewMatch must be called first)
            if (!currentMatchId || !currentConnectionCode) {
                console.log('⚠️ No connection code - call startNewMatch() first');
                return;
            }

            // Prepare state object for scoreboard
            const scoreboardState = {
                matchId: currentMatchId,
                timestamp: new Date().toISOString(),
                
                // Match settings
                gameType: state.matchSettings?.gameType || '501',
                startType: state.matchSettings?.startType || 'SIDO',
                startScore: state.matchSettings?.startScore || 501,
                
                // Current set/leg info
                currentSet: state.currentSet || 1,
                currentLeg: state.currentLeg || 1,
                
                // Player 1 data
                player1: {
                    name: state.players?.player1?.name || 'Player 1',
                    score: state.players?.player1?.score || 501,
                    legAvg: Math.round((state.players?.player1?.legAvg || 0) * 100) / 100,
                    matchAvg: Math.round((state.players?.player1?.matchAvg || 0) * 100) / 100,
                    legWins: state.players?.player1?.legWins || 0,
                    setWins: state.players?.player1?.setWins || 0,
                    turnHistory: state.players?.player1?.turnHistory || [],
                    isActive: state.currentPlayer === 1
                },
                
                // Player 2 data
                player2: {
                    name: state.players?.player2?.name || 'Player 2',
                    score: state.players?.player2?.score || 501,
                    legAvg: Math.round((state.players?.player2?.legAvg || 0) * 100) / 100,
                    matchAvg: Math.round((state.players?.player2?.matchAvg || 0) * 100) / 100,
                    legWins: state.players?.player2?.legWins || 0,
                    setWins: state.players?.player2?.setWins || 0,
                    turnHistory: state.players?.player2?.turnHistory || [],
                    isActive: state.currentPlayer === 2
                },
                
                // Game state
                visitNumber: state.visitNumber || 1,
                lastUpdate: Date.now()
            };

            // Upsert to Supabase with connection code as game_id
            const { data, error } = await supabase
                .from('game_states')
                .upsert({
                    id: currentMatchId,
                    game_id: currentConnectionCode,
                    game_state: scoreboardState,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('❌ Error syncing to Supabase:', error);
            } else {
                console.log('✅ State synced to Supabase with code:', currentConnectionCode);
                console.log('📊 Game state:', scoreboardState);
            }
        } catch (error) {
            console.error('❌ Supabase sync error:', error);
        }
    }
};

// Make GameStateSync available globally
window.GameStateSync = GameStateSync;
