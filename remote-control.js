/**
 * Remote Control Module for VideoStreamScoringApp
 * Handles connection codes, player authentication, and real-time sync
 * 
 * Features:
 * - Generate unique connection codes for game rooms
 * - Authenticate players using Supabase auth and linked player accounts
 * - Real-time player presence tracking
 * - Sync game state across remote clients
 * - Host/Guest role management
 */

const RemoteControlModule = {
    // Configuration
    CONNECTION_CODE_LENGTH: 6,
    ROOM_CODE_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    INACTIVE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
    
    // State
    state: {
        currentRoom: null,
        currentUser: null,
        linkedPlayer: null,
        isHost: false,
        remotePlayer: null,
        subscription: null,
        presenceTimeout: null
    },

    /**
     * Initialize Remote Control Module
     * Sets up Supabase client reference and event listeners
     */
    async initialize() {
        console.log('🔄 Initializing Remote Control Module...');
        
        // Wait for Supabase to be available
        await this.waitForSupabase();
        
        // Set up UI event listeners
        this.setupEventListeners();
        
        console.log('✅ Remote Control Module initialized');
    },

    /**
     * Wait for Supabase client to be available
     */
    async waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available after timeout');
        }
    },

    /**
     * Set up UI event listeners for connection screens
     */
    setupEventListeners() {
        // These will be attached when screens are created
        // Prevent listener attachment errors on initial load
    },

    /**
     * Generate a unique 6-character connection code
     * @returns {string} Connection code like "ABC123"
     */
    generateConnectionCode() {
        let code = '';
        for (let i = 0; i < this.CONNECTION_CODE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * this.ROOM_CODE_CHARSET.length);
            code += this.ROOM_CODE_CHARSET[randomIndex];
        }
        return code;
    },

    /**
     * Check if a connection code is unique in database
     * @param {string} code - Connection code to check
     * @returns {boolean} True if unique
     */
    async isCodeUnique(code) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .select('id')
                .eq('room_code', code)
                .single();
            
            return !data; // Unique if no match found
        } catch (error) {
            // If error is "no rows returned", code is unique
            if (error.code === 'PGRST116') {
                return true;
            }
            console.error('Error checking code uniqueness:', error);
            return false;
        }
    },

    /**
     * Generate a unique connection code for a new room
     * @returns {string} Unique connection code
     */
    async generateUniqueCode() {
        let code;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!isUnique && attempts < maxAttempts) {
            code = this.generateConnectionCode();
            isUnique = await this.isCodeUnique(code);
            attempts++;
        }
        
        if (!isUnique) {
            throw new Error('Failed to generate unique connection code after 10 attempts');
        }
        
        return code;
    },

    /**
     * Get current authenticated user info
     * @returns {object} User object with id, email
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await window.supabaseClient.auth.getUser();
            
            if (error) {
                console.error('Error getting current user:', error);
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error in getCurrentUser:', error);
            return null;
        }
    },

    /**
     * Get linked player info for authenticated user
     * @param {string} userId - Supabase auth user ID
     * @returns {object} Player info with name, player_id
     */
    async getLinkedPlayer(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('player_accounts')
                .select('id, first_name, last_name, player_id, account_linked_player_id')
                .eq('user_id', userId)
                .single();
            
            if (error) {
                console.error('Error fetching linked player:', error);
                return null;
            }
            
            if (!data) {
                return null; // No linked player account
            }
            
            return {
                playerId: data.id,
                firstName: data.first_name,
                lastName: data.last_name,
                fullName: `${data.first_name} ${data.last_name}`,
                playerCode: data.player_id,
                linkedPlayerId: data.account_linked_player_id
            };
        } catch (error) {
            console.error('Error in getLinkedPlayer:', error);
            return null;
        }
    },

    /**
     * Create a new game room (host creates)
     * @returns {object} Room info with code and game_rooms ID
     */
    async createGameRoom() {
        try {
            // Get current user
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Get linked player
            const player = await this.getLinkedPlayer(user.id);
            if (!player) {
                throw new Error('No linked player account found');
            }
            
            // Generate unique code
            const code = await this.generateUniqueCode();
            
            // Create room in database
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .insert({
                    room_code: code,
                    host_id: user.id,
                    status: 'waiting',
                    game_state: {
                        host_player: {
                            userId: user.id,
                            playerId: player.playerId,
                            firstName: player.firstName,
                            lastName: player.lastName,
                            fullName: player.fullName
                        }
                    }
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error creating game room:', error);
                throw error;
            }
            
            // Store in module state
            this.state.currentRoom = {
                id: data.id,
                code: data.room_code,
                hostId: data.host_id,
                guestId: data.guest_id,
                status: data.status
            };
            
            this.state.currentUser = user;
            this.state.linkedPlayer = player;
            this.state.isHost = true;
            
            console.log(`✅ Game room created with code: ${code}`);
            
            return {
                roomId: data.id,
                code: data.room_code
            };
        } catch (error) {
            console.error('Error in createGameRoom:', error);
            throw error;
        }
    },

    /**
     * Join an existing game room with code
     * @param {string} code - Connection code like "ABC123"
     * @returns {object} Room info and host player info
     */
    async joinGameRoom(code) {
        try {
            // Validate code format
            if (!code || code.length !== this.CONNECTION_CODE_LENGTH) {
                throw new Error(`Invalid code format. Must be ${this.CONNECTION_CODE_LENGTH} characters.`);
            }
            
            // Get current user
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Get linked player
            const player = await this.getLinkedPlayer(user.id);
            if (!player) {
                throw new Error('No linked player account found');
            }
            
            // Find room by code
            const { data: room, error: roomError } = await window.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', code)
                .single();
            
            if (roomError) {
                if (roomError.code === 'PGRST116') {
                    throw new Error('Connection code not found');
                }
                throw roomError;
            }
            
            if (!room) {
                throw new Error('Connection code not found');
            }
            
            // Check if room is still waiting
            if (room.status !== 'waiting') {
                throw new Error('Game room is no longer accepting connections');
            }
            
            // Update room with guest info
            const { data: updatedRoom, error: updateError } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: user.id,
                    status: 'active',
                    game_state: {
                        ...room.game_state,
                        guest_player: {
                            userId: user.id,
                            playerId: player.playerId,
                            firstName: player.firstName,
                            lastName: player.lastName,
                            fullName: player.fullName
                        },
                        both_players_connected: true
                    }
                })
                .eq('id', room.id)
                .select()
                .single();
            
            if (updateError) {
                console.error('Error joining game room:', updateError);
                throw updateError;
            }
            
            // Store in module state
            this.state.currentRoom = {
                id: updatedRoom.id,
                code: updatedRoom.room_code,
                hostId: updatedRoom.host_id,
                guestId: updatedRoom.guest_id,
                status: updatedRoom.status
            };
            
            this.state.currentUser = user;
            this.state.linkedPlayer = player;
            this.state.isHost = false;
            
            console.log(`✅ Joined game room with code: ${code}`);
            
            return {
                roomId: updatedRoom.id,
                code: updatedRoom.room_code,
                hostPlayer: updatedRoom.game_state.host_player,
                guestPlayer: player
            };
        } catch (error) {
            console.error('Error in joinGameRoom:', error);
            throw error;
        }
    },

    /**
     * Listen for real-time updates on game room
     * @param {Function} onUpdate - Callback when room data changes
     */
    subscribeToRoom(onUpdate) {
        if (!this.state.currentRoom) {
            console.error('No active room to subscribe to');
            return;
        }
        
        try {
            // Unsubscribe from previous subscription if exists
            if (this.state.subscription) {
                window.supabaseClient.removeAllChannels();
            }
            
            // Subscribe to game_rooms changes for current room
            const channel = window.supabaseClient
                .channel(`room:${this.state.currentRoom.code}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'game_rooms',
                        filter: `room_code=eq.${this.state.currentRoom.code}`
                    },
                    (payload) => {
                        console.log('📡 Room update received:', payload);
                        onUpdate(payload.new);
                    }
                )
                .subscribe();
            
            this.state.subscription = channel;
            console.log('✅ Subscribed to room updates');
        } catch (error) {
            console.error('Error subscribing to room:', error);
        }
    },

    /**
     * Update game state in room
     * @param {object} gameState - Game state object to merge
     */
    async updateGameState(gameState) {
        if (!this.state.currentRoom) {
            console.error('No active room');
            return;
        }
        
        try {
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    game_state: gameState,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.state.currentRoom.id)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating game state:', error);
                throw error;
            }
            
            console.log('✅ Game state updated');
            return data;
        } catch (error) {
            console.error('Error in updateGameState:', error);
            throw error;
        }
    },

    /**
     * Leave current game room
     */
    async leaveRoom() {
        if (!this.state.currentRoom) {
            return;
        }
        
        try {
            // Unsubscribe from realtime updates
            if (this.state.subscription) {
                await this.state.subscription.unsubscribe();
                this.state.subscription = null;
            }
            
            // Update room status to finished if host leaves
            if (this.state.isHost) {
                await window.supabaseClient
                    .from('game_rooms')
                    .update({ status: 'finished' })
                    .eq('id', this.state.currentRoom.id);
            } else {
                // Guest leaves - update guest_id to null
                await window.supabaseClient
                    .from('game_rooms')
                    .update({ guest_id: null, status: 'waiting' })
                    .eq('id', this.state.currentRoom.id);
            }
            
            // Clear state
            this.state.currentRoom = null;
            this.state.currentUser = null;
            this.state.linkedPlayer = null;
            this.state.isHost = false;
            
            console.log('✅ Left game room');
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    },

    /**
     * Get players in current room
     * @returns {object} Object with hostPlayer and guestPlayer info
     */
    getPlayersInRoom() {
        if (!this.state.currentRoom) {
            return null;
        }
        
        return {
            hostPlayer: this.state.isHost ? this.state.linkedPlayer : this.state.remotePlayer?.hostPlayer,
            guestPlayer: !this.state.isHost ? this.state.linkedPlayer : this.state.remotePlayer?.guestPlayer
        };
    },

    /**
     * Check if both players are connected
     * @returns {boolean}
     */
    areBothPlayersConnected() {
        return !!(this.state.currentRoom && 
                  this.state.currentRoom.hostId && 
                  this.state.currentRoom.guestId);
    },

    /**
     * Check if current user is host
     * @returns {boolean}
     */
    isCurrentUserHost() {
        return this.state.isHost;
    },

    /**
     * Get current room code
     * @returns {string} Connection code
     */
    getCurrentRoomCode() {
        return this.state.currentRoom?.code;
    },

    /**
     * Get current linked player info
     * @returns {object} Player info
     */
    getLinkedPlayerInfo() {
        return this.state.linkedPlayer;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteControlModule;
}
