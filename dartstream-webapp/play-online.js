// ===== PLAY ONLINE MODULE =====
// Handles video calling and real-time game synchronization via Supabase Realtime

const PlayOnline = {
    roomCode: null,
    isHost: false,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    supabaseChannel: null,
    currentTurn: null, // 'host' or 'guest'
    opponentId: null,
    localPlayerId: null,

    // WebRTC Configuration
    rtcConfig: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    },

    // Initialize on page load
    async init() {
        console.log('PlayOnline initializing...');
        
        // Wait for Supabase to be ready
        await this.waitForSupabase();
        
        if (!window.supabaseClient) {
            console.error('Failed to initialize Supabase client');
            alert('Failed to connect to database. Please refresh the page.');
            return;
        }
        
        // Check if user is authenticated
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            alert('Please sign in to use Play Online features');
            window.location.href = 'player-account.html';
            return;
        }

        this.localPlayerId = session.user.id;
        console.log('User authenticated:', this.localPlayerId);

        // Enumerate media devices
        await this.enumerateDevices();
    },

    waitForSupabase() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            let attempts = 0;
            
            const checkClient = () => {
                attempts++;
                
                // Try to get the client using the global function
                if (typeof getSupabaseClient === 'function') {
                    const client = getSupabaseClient();
                    if (client) {
                        console.log('Supabase client ready!');
                        resolve();
                        return;
                    }
                }
                
                // Also check if it already exists on window
                if (window.supabaseClient) {
                    console.log('Supabase client found on window!');
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('Timeout waiting for Supabase to load'));
                    return;
                }
                
                setTimeout(checkClient, 100);
            };
            
            checkClient();
        });
    },

    // Show host setup screen
    async showHostSetup() {
        document.getElementById('initial-setup').classList.add('hidden');
        document.getElementById('host-setup').classList.remove('hidden');
        
        this.isHost = true;
        this.currentTurn = 'host'; // Host starts
        
        // Generate 4-digit room code
        this.roomCode = this.generateRoomCode();
        document.getElementById('generated-room-code').textContent = this.roomCode;

        // Create room in Supabase
        await this.createRoom();
        
        // Listen for opponent joining
        await this.listenForOpponent();
    },

    // Show join setup screen
    showJoinSetup() {
        document.getElementById('initial-setup').classList.add('hidden');
        document.getElementById('join-setup').classList.remove('hidden');
        this.isHost = false;
    },

    // Cancel host
    cancelHost() {
        if (this.supabaseChannel) {
            this.supabaseChannel.unsubscribe();
        }
        this.resetToInitial();
    },

    // Cancel join
    cancelJoin() {
        this.resetToInitial();
    },

    resetToInitial() {
        document.getElementById('host-setup').classList.add('hidden');
        document.getElementById('join-setup').classList.add('hidden');
        document.getElementById('initial-setup').classList.remove('hidden');
        this.roomCode = null;
    },

    // Generate random 4-digit alphanumeric code
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Create room in Supabase
    async createRoom() {
        try {
            // Ensure client is ready
            if (!window.supabaseClient) {
                await this.waitForSupabase();
            }
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .insert([{
                    room_code: this.roomCode,
                    host_id: this.localPlayerId,
                    status: 'waiting',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            console.log('Room created:', data);
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    },

    // Listen for opponent joining
    async listenForOpponent() {
        // Ensure client is ready
        if (!window.supabaseClient) {
            await this.waitForSupabase();
        }
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        this.supabaseChannel = window.supabaseClient
            .channel(`room:${this.roomCode}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `room_code=eq.${this.roomCode}`
            }, (payload) => {
                console.log('Room updated:', payload);
                if (payload.new.guest_id && payload.new.status === 'active') {
                    this.opponentId = payload.new.guest_id;
                    // Host shows game config screen when guest joins
                    this.showGameConfig();
                }
            })
            .subscribe();
    },

    // Join existing room
    async joinRoom() {
        const code = document.getElementById('join-room-code').value.trim().toUpperCase();
        
        if (code.length !== 4) {
            alert('Please enter a 4-digit room code');
            return;
        }

        this.roomCode = code;

        try {
            // Ensure client is ready
            if (!window.supabaseClient) {
                await this.waitForSupabase();
            }
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            // Find room
            const { data: rooms, error: findError } = await window.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', code)
                .eq('status', 'waiting')
                .maybeSingle();

            if (findError) {
                console.error('Database error:', findError);
                alert('Error searching for room. Please try again.');
                return;
            }

            if (!rooms) {
                alert('Room not found or already in use');
                return;
            }

            this.opponentId = rooms.host_id;

            // Update room with guest
            const { error: updateError } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: this.localPlayerId,
                    status: 'active'
                })
                .eq('room_code', code);

            if (updateError) throw updateError;

            // Subscribe to room channel for signaling
            this.supabaseChannel = window.supabaseClient
                .channel(`room:${this.roomCode}`)
                .subscribe();

            // Guest: Immediately show split screen with waiting message
            this.showGuestWaitingScreen();
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
        }
    },

    // Show guest waiting screen (split screen with video + waiting message)
    showGuestWaitingScreen() {
        console.log('Guest: Showing split screen, waiting for host configuration...');
        
        // Hide setup, show main interface
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('videostream-container').classList.remove('hidden');

        // Show waiting message in scoring iframe
        const iframe = document.getElementById('scoring-iframe');
        iframe.contentWindow.postMessage({
            type: 'show-waiting',
            roomCode: this.roomCode,
            message: 'Host is preparing match...'
        }, '*');

        // Update connection status
        this.updateConnectionStatus('Connected - Waiting for host', true);

        // Listen for game updates (will receive config when host sends it)
        this.listenForGameUpdates();
    },

    // Show game configuration screen (Host only after both players connect)
    async showGameConfig() {
        console.log('Showing game configuration...');
        
        // Hide setup screens
        document.getElementById('setup-screen').classList.add('hidden');
        
        // Show split screen for host too
        document.getElementById('videostream-container').classList.remove('hidden');

        // Load the game setup interface in the iframe
        await this.loadPlayerNames();
        
        const iframe = document.getElementById('scoring-iframe');
        iframe.contentWindow.postMessage({
            type: 'show-setup',
            roomCode: this.roomCode,
            hostPlayerName: this.hostPlayerName,
            guestPlayerName: this.guestPlayerName,
            hostPlayerId: this.hostPlayerId,
            guestPlayerId: this.guestPlayerId
        }, '*');

        // Update connection status
        this.updateConnectionStatus('Connected - Configure match', true);

        // Listen for setup completion from iframe
        this.listenForGameUpdates();
    },

    // Load player names from player_accounts table
    async loadPlayerNames() {
        try {
            if (!window.supabaseClient) {
                await this.waitForSupabase();
            }

            // Get host's account
            const { data: hostAccount } = await window.supabaseClient
                .from('player_accounts')
                .select('first_name, last_name, account_linked_player_id')
                .eq('user_id', this.isHost ? this.localPlayerId : this.opponentId)
                .maybeSingle();

            // Get guest's account
            const { data: guestAccount } = await window.supabaseClient
                .from('player_accounts')
                .select('first_name, last_name, account_linked_player_id')
                .eq('user_id', this.isHost ? this.opponentId : this.localPlayerId)
                .maybeSingle();

            // Display names
            const hostName = hostAccount ? `${hostAccount.first_name} ${hostAccount.last_name}` : 'Host Player';
            const guestName = guestAccount ? `${guestAccount.first_name} ${guestAccount.last_name}` : 'Guest Player';

            document.getElementById('host-player-name').textContent = hostName;
            document.getElementById('guest-player-name').textContent = guestName;

            // Store for game initialization
            this.hostPlayerName = hostName;
            this.guestPlayerName = guestName;
            this.hostPlayerId = hostAccount?.account_linked_player_id;
            this.guestPlayerId = guestAccount?.account_linked_player_id;

        } catch (error) {
            console.error('Error loading player names:', error);
            document.getElementById('host-player-name').textContent = 'Host Player';
            document.getElementById('guest-player-name').textContent = 'Guest Player';
        }
    },

    // Cancel game config and disconnect
    cancelGameConfig() {
        if (confirm('Cancel match? This will disconnect both players.')) {
            this.disconnect();
            window.location.reload();
        }
    },

    // Confirm game configuration and start match (Host only)
    async confirmGameConfig() {
        // Get configuration values
        const gameType = document.getElementById('online-game-type').value;
        const matchFormat = document.getElementById('online-match-format').value;
        const startingPlayer = document.getElementById('online-starting-player').value;

        // Parse game type (e.g., "501-sido" -> startScore: 501, doubleOut: false)
        const [score, inOut] = gameType.split('-');
        const startScore = parseInt(score);
        const doubleOut = inOut === 'dido';

        // Parse match format
        let totalLegs = 1;
        let legsFormat = 'first-to';
        
        if (matchFormat === 'best-of-3') totalLegs = 3;
        else if (matchFormat === 'best-of-5') totalLegs = 5;
        else if (matchFormat === 'best-of-7') totalLegs = 7;
        else if (matchFormat === 'best-of-3-sets') totalLegs = 3; // Sets mode
        else if (matchFormat === 'best-of-5-sets') totalLegs = 5; // Sets mode

        if (matchFormat.includes('best-of')) {
            legsFormat = 'best-of';
        }

        // Set initial turn based on starting player
        this.currentTurn = startingPlayer; // 'host' or 'guest'

        // Create game config
        const gameConfig = {
            gameType: gameType,
            startScore: startScore,
            doubleOut: doubleOut,
            player1Name: this.hostPlayerName,
            player2Name: this.guestPlayerName,
            player1Id: this.hostPlayerId,
            player2Id: this.guestPlayerId,
            totalLegs: totalLegs,
            legsFormat: legsFormat,
            startingPlayer: startingPlayer
        };

        console.log('Game config:', gameConfig);

        // Broadcast config to guest
        await this.supabaseChannel.send({
            type: 'broadcast',
            event: 'game-config',
            payload: { from: this.localPlayerId, config: gameConfig }
        });

        // Start the match
        this.initializeMatch(gameConfig);
    },

    // Initialize match with config
    initializeMatch(config) {
        console.log('Initializing match with config:', config);
        
        // Hide config, show main interface
        document.getElementById('game-config-screen').classList.add('hidden');
        document.getElementById('videostream-container').classList.remove('hidden');

        // Update connection status
        this.updateConnectionStatus('Match in progress', true);

        // Initialize turn indicator
        this.updateTurnIndicator();

        // Listen for game state changes
        this.listenForGameUpdates();

        // Initialize the scoring app iframe with config
        const iframe = document.getElementById('scoring-iframe');
        iframe.contentWindow.postMessage({
            type: 'initialize-game',
            config: config
        }, '*');

        // Set initial turn control
        const isMyTurn = (this.isHost && this.currentTurn === 'host') || 
                         (!this.isHost && this.currentTurn === 'guest');
        
        iframe.contentWindow.postMessage({
            type: 'set-turn',
            enabled: isMyTurn
        }, '*');
    },

    // Original startMatch renamed and simplified for guest
    startMatch() {
        console.log('Starting match (guest waiting for config)...');
        
        // Hide setup, show waiting message
        document.getElementById('setup-screen').classList.add('hidden');
        // Guest waits for host to configure
        this.updateConnectionStatus('Waiting for host to configure match...', true);
    },

    // Enumerate available media devices
    async enumerateDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            const audioDevices = devices.filter(d => d.kind === 'audioinput');

            // Populate camera select
            const cameraSelect = document.getElementById('camera-select');
            cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Populate microphone select
            const micSelect = document.getElementById('microphone-select');
            micSelect.innerHTML = '';
            audioDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Microphone ${index + 1}`;
                micSelect.appendChild(option);
            });

            // Add change listeners
            cameraSelect.addEventListener('change', () => this.switchCamera());
            micSelect.addEventListener('change', () => this.switchMicrophone());

        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    },

    // Connect video call
    async connectVideo() {
        try {
            const cameraId = document.getElementById('camera-select').value;
            const micId = document.getElementById('microphone-select').value;

            const constraints = {
                video: { deviceId: cameraId ? { exact: cameraId } : undefined },
                audio: { deviceId: micId ? { exact: micId } : undefined }
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Show local video
            const localVideo = document.getElementById('local-video');
            localVideo.srcObject = this.localStream;

            // Hide waiting room
            document.getElementById('video-waiting').classList.add('hidden');

            // Update UI
            document.getElementById('connect-btn').classList.add('hidden');
            document.getElementById('hangup-btn').classList.remove('hidden');
            this.updateConnectionStatus('Video connected', true);

            // Initialize WebRTC connection
            await this.initWebRTC();

        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    },

    // Initialize WebRTC peer connection
    async initWebRTC() {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);

        // Add local stream tracks
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle incoming tracks
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track');
            const remoteVideo = document.getElementById('remote-video');
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal('ice-candidate', event.candidate);
            }
        };

        // Monitor connection state
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.updateConnectionStatus('Peer connected', true);
            }
        };

        // If host, create offer
        if (this.isHost) {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            this.sendSignal('offer', offer);
        }

        // Listen for signaling messages
        this.listenForSignals();
    },

    // Send signaling message via Supabase
    async sendSignal(type, data) {
        await this.supabaseChannel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type, data, from: this.localPlayerId }
        });
    },

    // Listen for signaling messages
    listenForSignals() {
        this.supabaseChannel.on('broadcast', { event: 'signal' }, async (payload) => {
            const { type, data, from } = payload.payload;
            
            if (from === this.localPlayerId) return; // Ignore own messages

            console.log('Received signal:', type);

            switch (type) {
                case 'offer':
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);
                    this.sendSignal('answer', answer);
                    break;

                case 'answer':
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                    break;

                case 'ice-candidate':
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    break;
            }
        });
    },

    // Toggle mute
    toggleMute() {
        if (!this.localStream) return;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const muteBtn = document.getElementById('mute-btn');
            if (audioTrack.enabled) {
                muteBtn.textContent = '🎤 Mute';
                muteBtn.classList.remove('active');
            } else {
                muteBtn.textContent = '🎤 Unmute';
                muteBtn.classList.add('active');
            }
        }
    },

    // Toggle video
    toggleVideo() {
        if (!this.localStream) return;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const videoBtn = document.getElementById('video-toggle-btn');
            if (videoTrack.enabled) {
                videoBtn.textContent = '📹 Camera Off';
                videoBtn.classList.remove('active');
            } else {
                videoBtn.textContent = '📹 Camera On';
                videoBtn.classList.add('active');
            }
        }
    },

    // Switch camera
    async switchCamera() {
        if (!this.localStream) return;

        const cameraId = document.getElementById('camera-select').value;
        const constraints = {
            video: { deviceId: { exact: cameraId } }
        };

        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = newStream.getVideoTracks()[0];
            
            const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(videoTrack);
            }

            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            oldVideoTrack.stop();
            this.localStream.removeTrack(oldVideoTrack);
            this.localStream.addTrack(videoTrack);

            document.getElementById('local-video').srcObject = this.localStream;
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    },

    // Switch microphone
    async switchMicrophone() {
        if (!this.localStream) return;

        const micId = document.getElementById('microphone-select').value;
        const constraints = {
            audio: { deviceId: { exact: micId } }
        };

        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const audioTrack = newStream.getAudioTracks()[0];
            
            const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) {
                sender.replaceTrack(audioTrack);
            }

            const oldAudioTrack = this.localStream.getAudioTracks()[0];
            oldAudioTrack.stop();
            this.localStream.removeTrack(oldAudioTrack);
            this.localStream.addTrack(audioTrack);
        } catch (error) {
            console.error('Error switching microphone:', error);
        }
    },

    // Hang up video call
    hangup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        document.getElementById('local-video').srcObject = null;
        document.getElementById('remote-video').srcObject = null;
        document.getElementById('video-waiting').classList.remove('hidden');
        document.getElementById('connect-btn').classList.remove('hidden');
        document.getElementById('hangup-btn').classList.add('hidden');
        
        this.updateConnectionStatus('Video disconnected', false);
    },

    // Update connection status indicator
    updateConnectionStatus(text, connected) {
        document.getElementById('connection-text').textContent = text;
        const indicator = document.getElementById('connection-indicator');
        if (connected) {
            indicator.classList.add('connected');
        } else {
            indicator.classList.remove('connected');
        }
    },

    // Listen for game state updates
    listenForGameUpdates() {
        // Listen for scoring updates from iframe
        window.addEventListener('message', (event) => {
            if (event.data.type === 'game-config-complete') {
                // Host finished configuring match
                console.log('Game config completed:', event.data.config);
                const config = event.data.config;
                
                // Set current turn
                this.currentTurn = config.startingPlayer;
                this.hostPlayerName = config.player1Name;
                this.guestPlayerName = config.player2Name;
                
                // Broadcast config to guest
                this.supabaseChannel.send({
                    type: 'broadcast',
                    event: 'game-config',
                    payload: { from: this.localPlayerId, config: config }
                });
                
                // Initialize match for host
                this.initializeMatch(config);
            }
            else if (event.data.type === 'score-update') {
                console.log('Score updated:', event.data);
                this.broadcastGameState(event.data);
                this.switchTurn();
            } else if (event.data.type === 'match-complete') {
                console.log('Match completed:', event.data);
                this.handleMatchComplete(event.data);
            }
        });

        // Listen for game config from host (Guest only)
        this.supabaseChannel.on('broadcast', { event: 'game-config' }, (payload) => {
            const { from, config } = payload.payload;
            if (from !== this.localPlayerId && !this.isHost) {
                console.log('Received game config from host:', config);
                this.currentTurn = config.startingPlayer;
                this.hostPlayerName = config.player1Name;
                this.guestPlayerName = config.player2Name;
                this.initializeMatch(config);
            }
        });

        // Listen for game state broadcasts
        this.supabaseChannel.on('broadcast', { event: 'game-state' }, (payload) => {
            const { from, gameState } = payload.payload;
            if (from !== this.localPlayerId) {
                console.log('Received game state from opponent:', gameState);
                this.updateLocalGameState(gameState);
            }
        });

        // Listen for match completion from opponent
        this.supabaseChannel.on('broadcast', { event: 'match-complete' }, (payload) => {
            const { from, matchData } = payload.payload;
            if (from !== this.localPlayerId) {
                console.log('Opponent completed match, saving stats...');
                this.saveRemoteMatchStats(matchData);
            }
        });
    },

    // Broadcast game state to opponent
    async broadcastGameState(gameState) {
        await this.supabaseChannel.send({
            type: 'broadcast',
            event: 'game-state',
            payload: { from: this.localPlayerId, gameState }
        });
    },

    // Update local game state from opponent
    updateLocalGameState(gameState) {
        const iframe = document.getElementById('scoring-iframe');
        iframe.contentWindow.postMessage({
            type: 'update-game-state',
            gameState: gameState
        }, '*');
    },

    // Switch turn between players
    switchTurn() {
        this.currentTurn = this.currentTurn === 'host' ? 'guest' : 'host';
        this.updateTurnIndicator();
        
        // Enable/disable scoring controls based on turn
        const isMyTurn = (this.isHost && this.currentTurn === 'host') || 
                         (!this.isHost && this.currentTurn === 'guest');
        
        const iframe = document.getElementById('scoring-iframe');
        iframe.contentWindow.postMessage({
            type: 'set-turn',
            enabled: isMyTurn
        }, '*');
    },

    // Update turn indicator
    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const isMyTurn = (this.isHost && this.currentTurn === 'host') || 
                         (!this.isHost && this.currentTurn === 'guest');
        
        indicator.classList.add('active');
        if (isMyTurn) {
            indicator.textContent = '✅ Your Turn';
            indicator.classList.add('your-turn');
            indicator.classList.remove('opponent-turn');
        } else {
            indicator.textContent = '⏳ Opponent\'s Turn';
            indicator.classList.add('opponent-turn');
            indicator.classList.remove('your-turn');
        }
    },

    // Handle match completion from scoring iframe
    async handleMatchComplete(matchData) {
        console.log('Handling match completion...');
        
        try {
            // Get current user's player account info
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            const { data: accountData } = await window.supabaseClient
                .from('player_accounts')
                .select('account_linked_player_id, first_name, last_name')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (!accountData || !accountData.account_linked_player_id) {
                console.log('No linked player account, stats not saved');
                // Broadcast to opponent anyway
                await this.broadcastMatchComplete(matchData);
                return;
            }

            // Get opponent's account info from room
            const { data: roomData } = await window.supabaseClient
                .from('game_rooms')
                .select('host_id, guest_id')
                .eq('room_code', this.roomCode)
                .single();

            const opponentUserId = this.isHost ? roomData.guest_id : roomData.host_id;
            
            const { data: opponentAccount } = await window.supabaseClient
                .from('player_accounts')
                .select('account_linked_player_id, first_name, last_name')
                .eq('user_id', opponentUserId)
                .maybeSingle();

            // Determine which player is local
            const localPlayerName = `${accountData.first_name} ${accountData.last_name}`;
            const opponentPlayerName = opponentAccount ? 
                `${opponentAccount.first_name} ${opponentAccount.last_name}` : 'Opponent';

            // Extract match stats for local player
            const gameState = matchData.gameState;
            let localPlayerStats, localPlayerNum;
            
            if (gameState.players.player1.name === localPlayerName) {
                localPlayerStats = gameState.players.player1;
                localPlayerNum = 1;
            } else {
                localPlayerStats = gameState.players.player2;
                localPlayerNum = 2;
            }

            const winnerNum = matchData.winnerNum;
            const matchId = `online_${this.roomCode}_${Date.now()}`;
            const matchDate = new Date().toISOString();

            // Prepare match stats for local player
            const localMatchData = {
                match_id: matchId,
                player_library_id: accountData.account_linked_player_id,
                opponent_name: opponentPlayerName,
                match_date: matchDate,
                won: winnerNum === localPlayerNum,
                legs_won: localPlayerStats.legWins,
                legs_lost: localPlayerNum === 1 ? gameState.players.player2.legWins : gameState.players.player1.legWins,
                sets_won: localPlayerStats.setWins,
                sets_lost: localPlayerNum === 1 ? gameState.players.player2.setWins : gameState.players.player1.setWins,
                total_darts_thrown: localPlayerStats.matchDarts,
                total_score: localPlayerStats.matchScore,
                average_3dart: localPlayerStats.matchAvg,
                first_9_average: 0,
                highest_checkout: 0,
                checkout_percentage: 0,
                count_180s: localPlayerStats.achievements.count_180s,
                count_171s: localPlayerStats.achievements.count_171s,
                count_95s: localPlayerStats.achievements.count_95s,
                count_100_plus: localPlayerStats.achievements.count_100_plus,
                count_120_plus: localPlayerStats.achievements.count_120_plus,
                count_140_plus: localPlayerStats.achievements.count_140_plus,
                count_160_plus: localPlayerStats.achievements.count_160_plus,
                leg_scores: gameState.allLegs || [],
                checkout_history: []
            };

            // Save to database
            await window.PlayerDB.recordMatchStats(localMatchData);
            console.log('Local player stats saved successfully');

            // Broadcast completion to opponent with full match data
            await this.broadcastMatchComplete({
                ...matchData,
                matchId: matchId,
                localPlayerName: localPlayerName,
                opponentPlayerName: opponentPlayerName
            });

            alert('Match completed! Your stats have been saved to your account.');
            
        } catch (error) {
            console.error('Error saving match stats:', error);
            alert('Match completed, but there was an error saving stats.');
        }
    },

    // Broadcast match completion to opponent
    async broadcastMatchComplete(matchData) {
        await this.supabaseChannel.send({
            type: 'broadcast',
            event: 'match-complete',
            payload: { from: this.localPlayerId, matchData }
        });
    },

    // Save match stats when received from opponent
    async saveRemoteMatchStats(matchData) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            const { data: accountData } = await window.supabaseClient
                .from('player_accounts')
                .select('account_linked_player_id, first_name, last_name')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (!accountData || !accountData.account_linked_player_id) {
                console.log('No linked player account, stats not saved for opponent');
                return;
            }

            const localPlayerName = `${accountData.first_name} ${accountData.last_name}`;
            const gameState = matchData.gameState;
            
            // Find which player is local
            let localPlayerStats, localPlayerNum;
            if (gameState.players.player1.name === localPlayerName) {
                localPlayerStats = gameState.players.player1;
                localPlayerNum = 1;
            } else {
                localPlayerStats = gameState.players.player2;
                localPlayerNum = 2;
            }

            const winnerNum = matchData.winnerNum;
            const matchId = matchData.matchId || `online_${this.roomCode}_${Date.now()}`;

            // Prepare match stats
            const remoteMatchData = {
                match_id: matchId,
                player_library_id: accountData.account_linked_player_id,
                opponent_name: matchData.localPlayerName || 'Opponent',
                match_date: new Date().toISOString(),
                won: winnerNum === localPlayerNum,
                legs_won: localPlayerStats.legWins,
                legs_lost: localPlayerNum === 1 ? gameState.players.player2.legWins : gameState.players.player1.legWins,
                sets_won: localPlayerStats.setWins,
                sets_lost: localPlayerNum === 1 ? gameState.players.player2.setWins : gameState.players.player1.setWins,
                total_darts_thrown: localPlayerStats.matchDarts,
                total_score: localPlayerStats.matchScore,
                average_3dart: localPlayerStats.matchAvg,
                first_9_average: 0,
                highest_checkout: 0,
                checkout_percentage: 0,
                count_180s: localPlayerStats.achievements.count_180s,
                count_171s: localPlayerStats.achievements.count_171s,
                count_95s: localPlayerStats.achievements.count_95s,
                count_100_plus: localPlayerStats.achievements.count_100_plus,
                count_120_plus: localPlayerStats.achievements.count_120_plus,
                count_140_plus: localPlayerStats.achievements.count_140_plus,
                count_160_plus: localPlayerStats.achievements.count_160_plus,
                leg_scores: gameState.allLegs || [],
                checkout_history: []
            };

            await window.PlayerDB.recordMatchStats(remoteMatchData);
            console.log('Remote match stats saved successfully');
            alert('Match completed! Your stats have been saved to your account.');

        } catch (error) {
            console.error('Error saving remote match stats:', error);
        }
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    PlayOnline.init();
});

// Expose globally
window.PlayOnline = PlayOnline;
