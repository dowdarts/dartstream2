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
     * Initialize the app
     */
    async initialize(supabaseClient, playerId, playerName) {
        console.log('🎮 PlayOnlineApp initializing:', { playerId, playerName });
        
        try {
            this.supabaseClient = supabaseClient;
            this.state.playerId = playerId;
            this.state.playerName = playerName;
            
            // Initialize modules (assuming they're loaded globally)
            if (typeof VideoRoom !== 'undefined') {
                this.videoRoom = VideoRoom;
                console.log('✅ VideoRoom module loaded');
            } else {
                throw new Error('VideoRoom module not loaded');
            }
            
            if (typeof RoomManager !== 'undefined') {
                this.roomManager = RoomManager;
                await this.roomManager.initialize(supabaseClient, playerId);
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
                localVideo
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
            
            // Step 2: Initialize video room with peer signaling
            const localVideo = document.getElementById('localVideoContainer');
            if (!localVideo) {
                throw new Error('Local video container not found');
            }
            
            await this.videoRoom.initialize(
                roomCode,
                this.state.playerId,
                this.state.playerName,
                localVideo
            );
            
            console.log('✅ Video room initialized');
            
            // Set up event callbacks
            this.setupVideoRoomCallbacks();
            
            return {
                roomCode: roomCode,
                role: 'guest',
                hostId: roomData.hostId,
                isReady: true,
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
            console.log('📹 Peer video ready:', peerId);
            
            const videoElement = document.getElementById(`video-${peerId}`);
            if (videoElement) {
                videoElement.srcObject = stream;
                
                // Update status
                const statusEl = document.querySelector(`#peer-${peerId} .peer-status`);
                if (statusEl) {
                    statusEl.textContent = 'Connected';
                }
            }
            
            this.state.isPeerConnected = true;
            window.dispatchEvent(new CustomEvent('peerVideoReady', { detail: { peerId } }));
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

console.log('🎮 play-online-app.js loaded');
