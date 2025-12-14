// video-room.js - Standalone WebRTC Peer-to-Peer Video Calling Module
// Pure video communication - no scoring, no game logic

const VideoRoom = {
    // Room and peer information
    roomCode: null,
    playerId: null,
    playerName: null,
    peers: {}, // { peerId: { id, name, connection, stream, videoElement } }
    
    // WebRTC Configuration
    rtcConfig: {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
        ]
    },
    
    // Local media
    localStream: null,
    localVideoElement: null,
    
    // Supabase realtime channel
    supabaseClient: null,
    realtimeChannel: null,
    
    // Event callbacks
    onPeerJoined: null,
    onPeerLeft: null,
    onPeerVideoReady: null,
    onError: null,
    
    /**
     * Initialize the video room
     * @param {string} roomCode - The room code
     * @param {string} playerId - Local player ID (from Supabase auth)
     * @param {string} playerName - Local player nickname
     * @param {HTMLElement} localVideoEl - Element for local video
     */
    async initialize(roomCode, playerId, playerName, localVideoEl) {
        console.log('🎥 VideoRoom initializing:', { roomCode, playerId, playerName });
        
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.playerName = playerName;
        this.localVideoElement = localVideoEl;
        
        // Initialize Supabase client
        this.supabaseClient = window.supabase.createClient(
            'https://kswwbqumgsdissnwuiab.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnV1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mzk1OTExMjgsImV4cCI6MTk1NTE2NzEyOH0.rH2m0cUi5Bi8lUGNahIZ7b9M2vJrF4rMVlYH7VN4dzY'
        );
        
        // Request camera/microphone access
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            console.log('✅ Local media obtained');
            
            // Display local video
            if (this.localVideoElement) {
                this.localVideoElement.srcObject = this.localStream;
            }
            
            // Setup realtime channel for signaling
            this.setupRealtimeChannel();
            
        } catch (error) {
            console.error('❌ Error accessing media devices:', error);
            this.onError?.('Could not access camera/microphone. Check permissions.');
            throw error;
        }
    },
    
    /**
     * Setup Supabase Realtime channel for peer signaling
     */
    setupRealtimeChannel() {
        console.log('🌐 Setting up Realtime channel:', `video-room:${this.roomCode}`);
        
        this.realtimeChannel = this.supabaseClient.channel(`video-room:${this.roomCode}`);
        
        // Listen for peer signals (offer, answer, ICE candidates)
        this.realtimeChannel.on('broadcast', { event: 'peer-signal' }, async (payload) => {
            const { from, type, data } = payload.payload;
            
            // Ignore own messages
            if (from === this.playerId) return;
            
            console.log('📡 Received signal:', type, 'from', from);
            
            try {
                switch (type) {
                    case 'offer':
                        await this.handleRemoteOffer(from, data);
                        break;
                    case 'answer':
                        await this.handleRemoteAnswer(from, data);
                        break;
                    case 'ice-candidate':
                        await this.handleRemoteIceCandidate(from, data);
                        break;
                    case 'peer-joined':
                        this.handlePeerJoined(from, data);
                        break;
                    case 'peer-left':
                        this.handlePeerLeft(from);
                        break;
                }
            } catch (error) {
                console.error('❌ Error processing signal:', error);
            }
        });
        
        // Listen for peer presence updates
        this.realtimeChannel.on('presence', { event: 'sync' }, (payload) => {
            console.log('👥 Presence update:', payload);
        });
        
        this.realtimeChannel.subscribe(async (status) => {
            console.log('📡 Channel status:', status);
            if (status === 'SUBSCRIBED') {
                // Broadcast that we've joined
                await this.broadcastSignal('peer-joined', {
                    name: this.playerName,
                    timestamp: new Date().toISOString()
                });
            }
        });
    },
    
    /**
     * Create and send WebRTC offer to peer
     */
    async createOffer(peerId) {
        try {
            console.log('🎬 Creating offer for peer:', peerId);
            
            const peerConnection = new RTCPeerConnection(this.rtcConfig);
            this.peers[peerId] = {
                id: peerId,
                connection: peerConnection,
                stream: null,
                videoElement: null
            };
            
            // Add local stream to peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate to', peerId);
                    this.broadcastSignal('ice-candidate', event.candidate, peerId);
                }
            };
            
            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log('📹 Received remote track:', event.track.kind);
                this.peers[peerId].stream = event.streams[0];
                this.onPeerVideoReady?.(peerId, event.streams[0]);
            };
            
            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            console.log('✅ Offer created, sending to', peerId);
            await this.broadcastSignal('offer', offer, peerId);
            
        } catch (error) {
            console.error('❌ Error creating offer:', error);
            this.onError?.('Failed to create video connection');
        }
    },
    
    /**
     * Handle remote offer - create answer
     */
    async handleRemoteOffer(peerId, offer) {
        try {
            console.log('📨 Handling offer from', peerId);
            
            // Create peer connection if doesn't exist
            if (!this.peers[peerId]) {
                const peerConnection = new RTCPeerConnection(this.rtcConfig);
                this.peers[peerId] = {
                    id: peerId,
                    connection: peerConnection,
                    stream: null,
                    videoElement: null
                };
                
                // Add local stream
                if (this.localStream) {
                    this.localStream.getTracks().forEach(track => {
                        peerConnection.addTrack(track, this.localStream);
                    });
                }
                
                // Handle ICE candidates
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        this.broadcastSignal('ice-candidate', event.candidate, peerId);
                    }
                };
                
                // Handle remote stream
                peerConnection.ontrack = (event) => {
                    console.log('📹 Received remote track from', peerId);
                    this.peers[peerId].stream = event.streams[0];
                    this.onPeerVideoReady?.(peerId, event.streams[0]);
                };
            }
            
            const peerConnection = this.peers[peerId].connection;
            
            // Set remote description
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            console.log('✅ Answer created, sending to', peerId);
            await this.broadcastSignal('answer', answer, peerId);
            
        } catch (error) {
            console.error('❌ Error handling offer:', error);
        }
    },
    
    /**
     * Handle remote answer
     */
    async handleRemoteAnswer(peerId, answer) {
        try {
            console.log('📨 Handling answer from', peerId);
            
            const peerConnection = this.peers[peerId]?.connection;
            if (!peerConnection) {
                console.warn('❌ No peer connection for', peerId);
                return;
            }
            
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Answer processed for', peerId);
            
        } catch (error) {
            console.error('❌ Error handling answer:', error);
        }
    },
    
    /**
     * Handle ICE candidate
     */
    async handleRemoteIceCandidate(peerId, candidateData) {
        try {
            const peerConnection = this.peers[peerId]?.connection;
            if (!peerConnection) {
                console.warn('❌ No peer connection for ICE candidate from', peerId);
                return;
            }
            
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
            console.log('🧊 ICE candidate added for', peerId);
            
        } catch (error) {
            console.error('❌ Error adding ICE candidate:', error);
        }
    },
    
    /**
     * Handle peer joined notification
     */
    handlePeerJoined(peerId, data) {
        console.log('👋 Peer joined:', peerId, data);
        
        // Store peer info
        if (!this.peers[peerId]) {
            this.peers[peerId] = {
                id: peerId,
                name: data.name,
                connection: null,
                stream: null,
                videoElement: null
            };
        } else {
            this.peers[peerId].name = data.name;
        }
        
        // Create offer for new peer
        this.createOffer(peerId);
        
        this.onPeerJoined?.(peerId, data);
    },
    
    /**
     * Handle peer left notification
     */
    handlePeerLeft(peerId) {
        console.log('👋 Peer left:', peerId);
        
        // Close peer connection
        if (this.peers[peerId]?.connection) {
            this.peers[peerId].connection.close();
        }
        
        // Remove peer
        delete this.peers[peerId];
        
        this.onPeerLeft?.(peerId);
    },
    
    /**
     * Broadcast signal to peers via Supabase Realtime
     */
    async broadcastSignal(type, data, targetPeerId = null) {
        if (!this.realtimeChannel) {
            console.warn('⚠️ Realtime channel not ready');
            return;
        }
        
        try {
            await this.realtimeChannel.send({
                type: 'broadcast',
                event: 'peer-signal',
                payload: {
                    from: this.playerId,
                    to: targetPeerId,
                    type: type,
                    data: data
                }
            });
        } catch (error) {
            console.error('❌ Error broadcasting signal:', error);
        }
    },
    
    /**
     * Toggle local audio
     */
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log('🎤 Audio:', enabled ? 'ON' : 'OFF');
        }
    },
    
    /**
     * Toggle local video
     */
    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            console.log('📹 Video:', enabled ? 'ON' : 'OFF');
        }
    },
    
    /**
     * Leave the room
     */
    async leaveRoom() {
        console.log('👋 Leaving room');
        
        // Close all peer connections
        Object.values(this.peers).forEach(peer => {
            if (peer.connection) {
                peer.connection.close();
            }
        });
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Broadcast leave
        await this.broadcastSignal('peer-left', {});
        
        // Unsubscribe from channel
        if (this.realtimeChannel) {
            await this.realtimeChannel.unsubscribe();
        }
        
        this.peers = {};
        console.log('✅ Left room');
    },
    
    /**
     * Get list of peers in room
     */
    getPeers() {
        return Object.values(this.peers);
    },
    
    /**
     * Get peer by ID
     */
    getPeer(peerId) {
        return this.peers[peerId];
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoRoom;
}

console.log('📦 video-room.js loaded');
