// play-online-app.js - Main Video Call Room Orchestrator
// Coordinates VideoRoom and RoomManager for peer-to-peer calling

const PlayOnlineApp = {
    videoRoom: null,
    roomManager: null,
    supabaseClient: null,
    state: {
        playerId: null,
        playerName: null,
        isInitialized: false,
        isInRoom: false,
        isVideoActive: false,
        isPeerConnected: false
    },
    
    /**
     * Initialize the app with authenticated user
     */
    async initialize(supabaseClient) {
        console.log('🎮 PlayOnlineApp initializing');
        
        try {
            this.supabaseClient = supabaseClient;
            
            // Get authenticated user info
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session?.user?.id) {
                throw new Error('No authenticated user');
            }
            
            this.state.playerId = session.user.id;
            
            // Try to get player name from player_accounts table
            try {
                const { data: account } = await supabaseClient
                    .from('player_accounts')
                    .select('first_name, last_name')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                
                if (account) {
                    this.state.playerName = `${account.first_name} ${account.last_name}`;
                } else {
                    this.state.playerName = session.user.email?.split('@')[0] || 'Player';
                }
            } catch (e) {
                this.state.playerName = session.user.email?.split('@')[0] || 'Player';
            }
            
            console.log('✅ User info loaded:', { playerId: this.state.playerId, playerName: this.state.playerName });
            
            // Initialize modules (assuming they're loaded globally)
            if (typeof VideoRoom !== 'undefined') {
                this.videoRoom = VideoRoom;
                console.log('✅ VideoRoom module loaded');
            } else {
                throw new Error('VideoRoom module not loaded');
            }
            
            if (typeof RoomManager !== 'undefined') {
                this.roomManager = RoomManager;
                await this.roomManager.initialize(supabaseClient);
                console.log('✅ RoomManager module loaded');
            } else {
                throw new Error('RoomManager module not loaded');
            }
            
            this.state.isInitialized = true;
            console.log('✅ PlayOnlineApp initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            throw error;
        }
    },
    
    /**
     * CREATE NEW ROOM flow
     */
    async createAndStartRoom() {
        try {
            console.log('🆕 Creating new room...');
            
            if (!this.state.isInitialized) {
                throw new Error('App not initialized');
            }
            
            // Step 1: Create room in database
            const roomData = await this.roomManager.createRoom();
            this.state.isInRoom = true;
            
            console.log('✅ Room created:', roomData.roomCode);
            
            // Step 2: Initialize video room with peer signaling
            const localVideo = document.getElementById('localVideoContainer');
            if (!localVideo) {
                throw new Error('Local video container not found');
            }
            
            await this.videoRoom.initialize(
                roomData.roomCode,
                this.state.playerId,
                this.state.playerName,
                localVideo,
                window.PlayOnlineUI?.mediaStream,  // Pass existing media stream if available
                window.PlayOnlineUI?.getMediaConstraints?.()  // Pass media constraints from UI
            );
            
            console.log('✅ Video room initialized');
            
            // Set up event callbacks
            this.setupVideoRoomCallbacks();
            
            return {
                roomCode: roomData.roomCode,
                role: 'host',
                isReady: true
            };
            
        } catch (error) {
            console.error('❌ Error creating room:', error);
            this.state.isInRoom = false;
            throw error;
        }
    },
    
    /**
     * PUBLIC: JOIN ROOM (alias for joinExistingRoom)
     */
    async joinRoom(roomCode) {
        return await this.joinExistingRoom(roomCode);
    },
    
    /**
     * JOIN EXISTING ROOM flow
     */
    async joinExistingRoom(roomCode) {
        try {
            console.log('🔗 Joining room:', roomCode);
            
            if (!this.state.isInitialized) {
                throw new Error('App not initialized');
            }
            
            // Step 1: Join room in database
            const roomData = await this.roomManager.joinRoom(roomCode, this.state.playerName);
            this.state.isInRoom = true;
            
            console.log('✅ Joined room:', roomCode);
            
            // Step 2: Initialize Realtime channel but DON'T initialize video room yet
            // (let the UI configure devices first via handleConfirmDevices)
            const roomCodeChannel = `video-room:${roomCode}`;
            console.log('📡 Setting up Realtime channel:', roomCodeChannel);
            
            // Initialize minimal channel setup for presence
            this.videoRoom.roomCode = roomCode;
            this.videoRoom.currentPlayerId = this.state.playerId;
            this.videoRoom.currentPlayerName = this.state.playerName;
            
            // Set up event callbacks
            this.setupVideoRoomCallbacks();
            
            return {
                roomCode: roomCode,
                role: 'guest',
                hostId: roomData.hostId,
                isReady: false,  // Video NOT ready until devices confirmed
                participants: roomData.participants
            };
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            this.state.isInRoom = false;
            throw error;
        }
    },
    
    /**
     * Setup VideoRoom event callbacks
     */
    setupVideoRoomCallbacks() {
        // Peer joined - add their video element
        this.videoRoom.onPeerJoined = (peerId, peerData) => {
            console.log('👤 Peer joined:', peerId, peerData.name);
            
            // Create video element for peer
            const remoteVideoContainer = document.getElementById('remoteVideosContainer');
            if (remoteVideoContainer) {
                const videoElement = document.createElement('div');
                videoElement.id = `peer-${peerId}`;
                videoElement.className = 'peer-video-container';
                videoElement.innerHTML = `
                    <video id="video-${peerId}" autoplay playsinline muted></video>
                    <div class="peer-name">${peerData.name}</div>
                    <div class="peer-status">Connecting...</div>
                `;
                remoteVideoContainer.appendChild(videoElement);
            }
            
            // Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('peerJoined', { detail: { peerId, peerData } }));
        };
        
        // Peer's video ready
        this.videoRoom.onPeerVideoReady = (peerId, stream) => {
            console.log('📹 [APP] ===== PEER VIDEO READY =====');
            console.log('📹 [APP] Peer video ready callback triggered:', peerId);
            console.log('📹 [APP] Stream exists?', !!stream);
            console.log('📹 [APP] Stream ID:', stream?.id);
            console.log('📹 [APP] Stream active?', stream?.active);
            
            this.state.isPeerConnected = true;
            
            // Store peer name from peers object
            const peerName = this.videoRoom.peers[peerId]?.name || 'Unknown Peer';
            console.log('📹 [APP] Peer name from videoRoom.peers:', peerName);
            
            // Dispatch event with full peer data
            // Let the UI handler create the element and set the stream
            console.log('📡 [APP] Dispatching peerVideoReady event with detail:', { peerId, peerName, streamExists: !!stream });
            const event = new CustomEvent('peerVideoReady', { 
                detail: { 
                    peerId: peerId,
                    stream: stream,
                    peerName: peerName
                } 
            });
            window.dispatchEvent(event);
            console.log('✅ [APP] peerVideoReady event dispatched successfully');
            console.log('📹 [APP] ===== END PEER VIDEO READY =====');
        };
        
        // Peer left
        this.videoRoom.onPeerLeft = (peerId) => {
            console.log('👋 Peer left:', peerId);
            
            const peerContainer = document.getElementById(`peer-${peerId}`);
            if (peerContainer) {
                peerContainer.remove();
            }
            
            window.dispatchEvent(new CustomEvent('peerLeft', { detail: { peerId } }));
        };
        
        // Error
        this.videoRoom.onError = (error) => {
            console.error('⚠️ Video room error:', error);
            window.dispatchEvent(new CustomEvent('videoRoomError', { detail: { error } }));
        };
    },
    
    /**
     * Toggle audio on/off
     */
    async toggleAudio(enabled) {
        try {
            console.log('🎙️ Toggling audio:', enabled);
            
            if (!this.videoRoom) {
                throw new Error('Video room not initialized');
            }
            
            await this.videoRoom.toggleAudio(enabled);
            this.state.isVideoActive = enabled;
            
            return true;
            
        } catch (error) {
            console.error('❌ Error toggling audio:', error);
            throw error;
        }
    },
    
    /**
     * Toggle video on/off
     */
    async toggleVideo(enabled) {
        try {
            console.log('📹 Toggling video:', enabled);
            
            if (!this.videoRoom) {
                throw new Error('Video room not initialized');
            }
            
            await this.videoRoom.toggleVideo(enabled);
            this.state.isVideoActive = enabled;
            
            return true;
            
        } catch (error) {
            console.error('❌ Error toggling video:', error);
            throw error;
        }
    },
    
    /**
     * Leave the room
     */
    async leaveRoom() {
        try {
            console.log('👋 Leaving room...');
            
            // Leave video room
            if (this.videoRoom) {
                await this.videoRoom.leaveRoom();
            }
            
            // Leave database room
            if (this.roomManager) {
                await this.roomManager.leaveRoom();
            }
            
            this.state.isInRoom = false;
            this.state.isPeerConnected = false;
            this.state.isVideoActive = false;
            
            // Clear remote videos
            const remoteContainer = document.getElementById('remoteVideosContainer');
            if (remoteContainer) {
                remoteContainer.innerHTML = '';
            }
            
            console.log('✅ Left room');
            return true;
            
        } catch (error) {
            console.error('❌ Error leaving room:', error);
            throw error;
        }
    },
    
    /**
     * Get current app state
     */
    getState() {
        return { ...this.state };
    },
    
    /**
     * Get current room info
     */
    getCurrentRoom() {
        return this.roomManager.getCurrentRoom();
    }
};

// Export for use
window.PlayOnlineApp = PlayOnlineApp;

console.log('🎮 play-online-app.js loaded');
