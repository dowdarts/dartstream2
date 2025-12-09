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
            
            return (data || []).map(player => ({
                id: player.id,
                firstName: player.first_name,
                lastName: player.last_name,
                nationality: player.nationality,
                createdAt: player.created_at
            }));
        } catch (error) {
            console.error('Error fetching players:', error);
            return [];
        }
    },

    // Add a new player
    async addPlayer(firstName, lastName, nationality = null) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            console.log('Adding player:', firstName, lastName, nationality);
            
            const { data, error } = await supabase
                .from('players')
                .insert([
                    { 
                        first_name: firstName,
                        last_name: lastName,
                        nationality: nationality
                    }
                ])
                .select();
            
            console.log('Insert result:', { data, error });
            
            if (error) throw error;
            
            return {
                id: data[0].id,
                firstName: data[0].first_name,
                lastName: data[0].last_name,
                nationality: data[0].nationality,
                createdAt: data[0].created_at
            };
        } catch (error) {
            console.error('Error adding player:', error);
            console.error('Error details:', error.message, error.code);
            throw error;
        }
    },

    // Update a player
    async updatePlayer(id, firstName, lastName, nationality = null, customId = null) {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            const updateData = { 
                first_name: firstName,
                last_name: lastName
            };
            
            if (nationality !== null) {
                updateData.nationality = nationality;
            }
            
            // Update the id field if customId is provided
            if (customId !== null && customId !== '') {
                updateData.id = customId;
            }
            
            const { data, error } = await supabase
                .from('players')
                .update(updateData)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            return {
                id: data[0].id,
                firstName: data[0].first_name,
                lastName: data[0].last_name,
                nationality: data[0].nationality,
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

    // Get or create session connection code (one code per browser session)
    getOrCreateSessionCode() {
        // Check if we already have a session code
        let sessionCode = sessionStorage.getItem('dartstream-session-code');
        
        if (!sessionCode) {
            // Generate new code and store in session
            sessionCode = this.generateConnectionCode();
            sessionStorage.setItem('dartstream-session-code', sessionCode);
            console.log('🎯 Generated new session code:', sessionCode);
        } else {
            console.log('🔄 Reusing session code:', sessionCode);
        }
        
        currentConnectionCode = sessionCode;
        currentMatchId = 'match_' + currentConnectionCode + '_' + Date.now();
        
        return currentConnectionCode;
    },

    // Start a new match (reuse session code or generate if first time)
    startNewMatch() {
        return this.getOrCreateSessionCode();
    },

    // Generate new code (for manual refresh)
    generateNewCode() {
        // Clear old session code
        sessionStorage.removeItem('dartstream-session-code');
        // Generate new one
        currentConnectionCode = this.generateConnectionCode();
        sessionStorage.setItem('dartstream-session-code', currentConnectionCode);
        currentMatchId = 'match_' + currentConnectionCode + '_' + Date.now();
        console.log('🔄 Manually generated new code:', currentConnectionCode);
        return currentConnectionCode;
    },

    // End match (clear match ID but keep session code)
    endMatch() {
        currentMatchId = null;
        // Don't clear currentConnectionCode - keep it for next match
        console.log('🏁 Match ended, code preserved for session');
    },

    // Send heartbeat to keep match visible in Match Central
    async sendHeartbeat() {
        try {
            const supabase = getSupabaseClient();
            if (!supabase || !currentMatchId || !currentConnectionCode) {
                return;
            }

            // Just update the timestamp to show the match is still active
            await supabase
                .from('game_states')
                .update({ 
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', currentConnectionCode);
            
            console.log('💓 Heartbeat sent');
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
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
                gameStarted: true, // Required for match-central to show the match
                
                // Match settings
                gameType: state.matchSettings?.gameType || '501',
                startType: state.matchSettings?.startType || 'SIDO',
                startScore: state.matchSettings?.startScore || 501,
                
                // Current set/leg info
                currentSet: state.currentSet || 1,
                currentLeg: state.currentLeg || 1,
                
                // Match-central compatible fields
                homePlayerName: state.players?.player1?.name || 'Home',
                awayPlayerName: state.players?.player2?.name || 'Away',
                homeScore: state.players?.player1?.score || 501,
                awayScore: state.players?.player2?.score || 501,
                legs: {
                    home: state.players?.player1?.legWins || 0,
                    away: state.players?.player2?.legWins || 0
                },
                
                // Player 1 data
                player1: {
                    name: state.players?.player1?.name || 'Player 1',
                    nationality: state.players?.player1?.nationality || state.matchSettings?.player1Nationality || '',
                    score: state.players?.player1?.score || 501,
                    legAvg: Math.round((state.players?.player1?.legAvg || 0) * 100) / 100,
                    matchAvg: Math.round((state.players?.player1?.matchAvg || 0) * 100) / 100,
                    legDarts: state.players?.player1?.legDarts || 0,
                    matchDarts: state.players?.player1?.matchDarts || 0,
                    legWins: state.players?.player1?.legWins || 0,
                    setWins: state.players?.player1?.setWins || 0,
                    turnHistory: state.players?.player1?.turnHistory || [],
                    isActive: state.currentPlayer === 1
                },
                
                // Player 2 data
                player2: {
                    name: state.players?.player2?.name || 'Player 2',
                    nationality: state.players?.player2?.nationality || state.matchSettings?.player2Nationality || '',
                    score: state.players?.player2?.score || 501,
                    legAvg: Math.round((state.players?.player2?.legAvg || 0) * 100) / 100,
                    matchAvg: Math.round((state.players?.player2?.matchAvg || 0) * 100) / 100,
                    legDarts: state.players?.player2?.legDarts || 0,
                    matchDarts: state.players?.player2?.matchDarts || 0,
                    legWins: state.players?.player2?.legWins || 0,
                    setWins: state.players?.player2?.setWins || 0,
                    turnHistory: state.players?.player2?.turnHistory || [],
                    isActive: state.currentPlayer === 2
                },
                
                // Game state
                visitNumber: state.visitNumber || 1,
                legStarter: state.legStarter || null,
                currentPlayer: state.currentPlayer || 1,
                lastUpdate: Date.now()
            };

            // First, try to update existing row
            const { data: updateData, error: updateError } = await supabase
                .from('game_states')
                .update({
                    game_state: scoreboardState,
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', currentConnectionCode)
                .select();

            // If no rows were updated, insert a new one
            if (updateError || !updateData || updateData.length === 0) {
                const { data: insertData, error: insertError } = await supabase
                    .from('game_states')
                    .insert({
                        id: currentMatchId,
                        game_id: currentConnectionCode,
                        game_state: scoreboardState,
                        updated_at: new Date().toISOString()
                    })
                    .select();

                if (insertError) {
                    console.error('❌ Error inserting to Supabase:', insertError);
                } else {
                    console.log('✅ State inserted to Supabase with code:', currentConnectionCode);
                    console.log('📊 Game state:', scoreboardState);
                }
            } else {
                console.log('✅ State updated in Supabase with code:', currentConnectionCode);
                console.log('📊 Game state:', scoreboardState);
            }
        } catch (error) {
            console.error('❌ Supabase sync error:', error);
        }
    }
};

// Make GameStateSync available globally
window.GameStateSync = GameStateSync;
