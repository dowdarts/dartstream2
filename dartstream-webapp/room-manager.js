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
     * Initialize room manager with authenticated user
     */
    async initialize(supabaseClient) {
        console.log('🏠 RoomManager initializing');
        
        this.supabaseClient = supabaseClient;
        
        // Get authenticated user ID
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.user?.id) {
                this.playerId = session.user.id;
                console.log('✅ Using authenticated user ID:', this.playerId);
            } else {
                throw new Error('No authenticated user found');
            }
        } catch (error) {
            console.error('❌ Error getting authenticated user:', error);
            throw error;
        }
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
            
            // Prepare room data - host_id MUST be the authenticated user
            const roomData = {
                id: roomId,
                room_code: roomCode,
                host_id: this.playerId,
                status: 'waiting',
                game_state: {
                    participants: [{ id: this.playerId, name: 'Host', joinedAt: new Date().toISOString() }],
                    createdAt: new Date().toISOString()
                }
            };
            
            console.log('📤 Creating room via PostgREST (authenticated user)');
            
            // Use PostgREST directly with authenticated client
            // RLS policy will verify auth.uid() = host_id
            const { data, error } = await this.supabaseClient
                .from('game_rooms')
                .insert([roomData])
                .select();
            
            if (error) {
                console.error('❌ Room creation error:', error);
                throw error;
            }
            
            this.currentRoomCode = roomCode;
            this.currentRoomId = roomId;
            this.isHost = true;
            
            console.log('✅ Room created successfully:', { roomCode, roomId });
            return {
                roomCode: roomCode,
                roomId: roomId,
                isHost: true,
                participants: []
            };
            
        } catch (error) {
            console.error('❌ Error creating room:', error.message);
            throw error;
        }
    },
    
    /**
     * Get auth token for requests
     */
    async getAuthToken() {
        try {
            const session = await this.supabaseClient?.auth?.getSession();
            if (session?.data?.session?.access_token) {
                return session.data.session.access_token;
            }
        } catch (e) {
            console.log('⚠️ No authenticated user, using anon token');
        }
        return 'anon';

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
            
            // Find room by code - status can be 'waiting' (no one joined yet) or 'active' (has participants)
            const { data: rooms, error: searchError } = await this.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode);
            
            if (searchError) {
                console.error('❌ Error searching for room:', searchError);
                throw searchError;
            }
            
            if (!rooms || rooms.length === 0) {
                throw new Error('Room code not found');
            }
            
            const room = rooms[0];
            
            // Check if room is expired or completed
            if (room.status === 'completed' || room.status === 'expired') {
                throw new Error('Room is no longer available. Please create or join a different room.');
            }
            
            // Check if this user is already in the room (re-joining for device config)
            const participants = room.game_state?.participants || [];
            const isAlreadyParticipant = participants.some(p => p.id === this.playerId);
            
            if (isAlreadyParticipant) {
                console.log('ℹ️ Player already in room, skipping duplicate join');
                return {
                    roomCode: roomCode,
                    roomId: room.id,
                    isHost: false,
                    hostId: room.host_id,
                    participants: participants
                };
            }
            
            // Add guest to participants
            participants.push({
                id: this.playerId,
                name: playerName,
                joinedAt: new Date().toISOString()
            });
            
            // If status is still 'waiting' and this is the first guest, set to 'active'
            const newStatus = room.status === 'waiting' ? 'active' : room.status;
            
            const { data: updated, error: updateError } = await this.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: this.playerId,
                    status: newStatus,
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
            
            console.log('✅ Joined room:', roomCode, 'with status:', newStatus);
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
