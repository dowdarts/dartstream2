// room-manager.js - Room Creation, Joining, and Management
// Handles Supabase game_rooms table for video call room coordination

// UUID v4 Generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const RoomManager = {
    supabaseClient: null,
    currentRoomCode: null,
    currentRoomId: null,
    playerId: null,
    isHost: false,
    
    /**
     * Initialize room manager
     */
    async initialize(supabaseClient, playerId) {
        console.log('🏠 RoomManager initializing:', playerId);
        
        this.supabaseClient = supabaseClient;
        this.playerId = playerId;
    },
    
    /**
     * Generate a random 4-digit room code
     */
    generateRoomCode() {
        const code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        console.log('🔑 Generated room code:', code);
        return code;
    },
    
    /**
     * Create a new video room
     * @returns {Object} Room data with room_code and room_id
     */
    async createRoom() {
        try {
            const roomCode = this.generateRoomCode();
            
            console.log('🆕 Creating new video room with code:', roomCode);
            
            // Generate a UUID for the room ID
            const roomId = this.generateUUID();
            
            // Get Supabase config from window or client
            const supabaseUrl = window.supabaseClient?.supabaseUrl || 'https://kswwbqumgsdissnwuiab.supabase.co';
            const supabaseKey = window.supabaseClient?.supabaseKey || (window.localStorage.getItem('supabase.auth.token') ? '' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnd1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODMwNTIsImV4cCI6MjA4MDA1OTA1Mn0.b-z8JqL1dBYJcrrzSt7u6VAaFAtTOl1vqqtFFgHkJ50');
            
            console.log('🔑 Using Supabase URL:', supabaseUrl);
            
            // Use Supabase client to make the request (it handles auth properly)
            const { error } = await this.supabaseClient
                .from('game_rooms')
                .insert({
                    id: roomId,
                    room_code: roomCode,
                    host_id: this.playerId,
                    status: 'waiting',
                    game_state: {
                        participants: [{ id: this.playerId, name: 'Host', joinedAt: new Date().toISOString() }],
                        createdAt: new Date().toISOString()
                    }
                });
            
            if (error) {
                console.error('❌ Error creating room - Message:', error.message);
                console.error('❌ Error creating room - Code:', error.code);
                console.error('❌ Error creating room - Details:', error.details);
                console.error('❌ Error creating room - Hint:', error.hint);
                console.error('❌ Error creating room - Full:', JSON.stringify(error, null, 2));
                throw error;
            }
            
            this.currentRoomCode = roomCode;
            this.currentRoomId = roomId;
            this.isHost = true;
            
            console.log('✅ Room created:', { roomCode, roomId });
            return {
                roomCode: roomCode,
                roomId: roomId,
                isHost: true,
                participants: []
            };
            
        } catch (error) {
            console.error('❌ Error creating room - Catch Message:', error.message);
            console.error('❌ Error creating room - Catch Code:', error.code);
            console.error('❌ Error creating room - Catch Details:', error.details);
            console.error('❌ Error creating room - Catch Hint:', error.hint);
            console.error('❌ Error creating room - Catch Full:', JSON.stringify(error, null, 2));
            throw error;
        }
    },
    
    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * Join an existing video room
     * @param {string} roomCode - The 4-digit room code
     * @param {string} playerName - The joining player's name
     * @returns {Object} Room data
     */
    async joinRoom(roomCode, playerName) {
        try {
            console.log('🔗 Joining room:', roomCode);
            
            // Find room by code
            const { data: rooms, error: searchError } = await this.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode)
                .eq('status', 'waiting');
            
            if (searchError) {
                console.error('❌ Error searching for room:', searchError);
                throw searchError;
            }
            
            if (!rooms || rooms.length === 0) {
                throw new Error('Room not found or already in progress');
            }
            
            const room = rooms[0];
            
            // Update room with guest
            const participants = room.game_state?.participants || [];
            participants.push({
                id: this.playerId,
                name: playerName,
                joinedAt: new Date().toISOString()
            });
            
            const { data: updated, error: updateError } = await this.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: this.playerId,
                    status: 'active',
                    game_state: {
                        ...room.game_state,
                        participants: participants
                    }
                })
                .eq('id', room.id)
                .select();
            
            if (updateError) {
                console.error('❌ Error joining room:', updateError);
                throw updateError;
            }
            
            this.currentRoomCode = roomCode;
            this.currentRoomId = room.id;
            this.isHost = false;
            
            console.log('✅ Joined room:', roomCode);
            return {
                roomCode: roomCode,
                roomId: room.id,
                isHost: false,
                hostId: room.host_id,
                participants: participants
            };
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            throw error;
        }
    },
    
    /**
     * Get room details
     */
    async getRoomDetails(roomCode) {
        try {
            const { data, error } = await this.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode)
                .single();
            
            if (error) throw error;
            
            return {
                roomId: data.id,
                roomCode: data.room_code,
                hostId: data.host_id,
                status: data.status,
                participants: data.game_state?.participants || []
            };
            
        } catch (error) {
            console.error('❌ Error getting room details:', error);
            throw error;
        }
    },
    
    /**
     * Update room status
     */
    async updateRoomStatus(status) {
        try {
            if (!this.currentRoomId) {
                throw new Error('No active room');
            }
            
            const { error } = await this.supabaseClient
                .from('game_rooms')
                .update({ status: status })
                .eq('id', this.currentRoomId);
            
            if (error) throw error;
            
            console.log('✅ Room status updated:', status);
            return true;
            
        } catch (error) {
            console.error('❌ Error updating room status:', error);
            throw error;
        }
    },
    
    /**
     * Leave/close the room
     */
    async leaveRoom() {
        try {
            if (!this.currentRoomId) {
                console.log('⚠️ No active room to leave');
                return;
            }
            
            console.log('👋 Leaving room:', this.currentRoomCode);
            
            if (this.isHost) {
                // Host closes the room
                await this.supabaseClient
                    .from('game_rooms')
                    .update({ status: 'finished' })
                    .eq('id', this.currentRoomId);
            }
            
            this.currentRoomCode = null;
            this.currentRoomId = null;
            this.isHost = false;
            
            console.log('✅ Left room');
            return true;
            
        } catch (error) {
            console.error('❌ Error leaving room:', error);
            throw error;
        }
    },
    
    /**
     * Cleanup old/abandoned rooms (older than 1 hour in waiting status)
     */
    async cleanupOldRooms() {
        try {
            const { error } = await this.supabaseClient.rpc('cleanup_old_rooms');
            if (error) throw error;
            
            console.log('✅ Old rooms cleaned up');
            
        } catch (error) {
            console.error('⚠️ Error cleaning up old rooms:', error);
        }
    },
    
    /**
     * Get current room info
     */
    getCurrentRoom() {
        return {
            roomCode: this.currentRoomCode,
            roomId: this.currentRoomId,
            isHost: this.isHost
        };
    }
};

// Export for use in modules
window.RoomManager = RoomManager;

console.log('📦 room-manager.js loaded');
