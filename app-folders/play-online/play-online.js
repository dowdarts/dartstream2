// play-online.js - UI Controller for Play Online App
// Handles screen navigation, form interactions, and UI updates

// UUID v4 Generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const PlayOnlineUI = {
    currentPlayerId: null,
    currentPlayerName: null,
    currentCountry: null,
    startTime: null,
    callTimer: null,
    supabaseClient: null,
    
    /**
     * Initialize the UI system
     */
    async initialize() {
        console.log('🎨 PlayOnlineUI initializing...');
        
        try {
            // Supabase should be ready now (PlayerDB exists)
            // We don't strictly need supabaseClient for basic video functionality
            if (window.PlayerDB) {
                this.supabaseClient = window.PlayerDB.supabaseClient || window.supabaseClient;
            }
            
            // Load country flags
            await this.loadCountryFlags();
            
            // Attach event listeners
            this.attachEventListeners();
            
            console.log('✅ PlayOnlineUI initialized');
            
        } catch (error) {
            console.error('❌ Error initializing UI:', error);
            this.showError('Failed to initialize. Please refresh the page.');
        }
    },
    
    /**
     * Load country flags into dropdown
     */
    async loadCountryFlags() {
        // No longer needed - we skip the setup screen
    },
    
    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Host or Join Screen
        document.getElementById('hostGameBtn')?.addEventListener('click', () => this.handleHostGame());
        document.getElementById('joinGameBtn')?.addEventListener('click', () => this.handleJoinGame());
        
        // Join code input - auto-format to 4 digits
        document.getElementById('joinRoomCodeInput')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        });
        
        // Test Screen
        document.getElementById('testRetryBtn')?.addEventListener('click', () => this.handleTestRetry());
        document.getElementById('testContinueBtn')?.addEventListener('click', () => this.handleTestContinue());
        
        // Lobby Screen
        document.getElementById('copyRoomCodeBtn')?.addEventListener('click', () => this.copyRoomCodeToClipboard());
        document.getElementById('startVideoBtn')?.addEventListener('click', () => this.handleStartVideo());
        document.getElementById('leaveLobbyBtn')?.addEventListener('click', () => this.handleLeaveLobby());
        
        // Video Call Screen
        document.getElementById('micToggleBtn')?.addEventListener('click', () => this.toggleMicrophone());
        document.getElementById('cameraToggleBtn')?.addEventListener('click', () => this.toggleCamera());
        document.getElementById('hangupBtn')?.addEventListener('click', () => this.handleHangup());
        
        // Ended Screen
        document.getElementById('newCallBtn')?.addEventListener('click', () => this.handleNewCall());
        document.getElementById('exitAppBtn')?.addEventListener('click', () => this.handleExitApp());
        
        // Error Modal
        document.getElementById('errorCloseBtn')?.addEventListener('click', () => this.hideError());
        
        // Listen for app events
        window.addEventListener('peerJoined', (e) => this.onPeerJoined(e.detail));
        window.addEventListener('peerLeft', (e) => this.onPeerLeft(e.detail));
        window.addEventListener('peerVideoReady', (e) => this.onPeerVideoReady(e.detail));
        window.addEventListener('videoRoomError', (e) => this.onVideoRoomError(e.detail));
    },
    
    /**
     * SCREEN MANAGEMENT
     */
    
    /**
     * SCREEN MANAGEMENT
     */
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
        console.log('📱 Showing screen:', screenId);
    },
    
    showLoading(text = 'Loading...') {
        document.getElementById('loadingIndicator').style.display = 'flex';
        document.getElementById('loadingText').textContent = text;
    },
    
    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    },
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').style.display = 'flex';
    },
    
    hideError() {
        document.getElementById('errorModal').style.display = 'none';
    },
    
    /**
     * HOST OR JOIN FLOW
     */
    
    async handleHostGame() {
        try {
            // Generate unique player ID (UUID v4)
            this.currentPlayerId = generateUUID();
            console.log('✅ Host mode - Player ID:', this.currentPlayerId);
            
            this.showLoading('Setting up video test...');
            
            // Initialize app with host
            await PlayOnlineApp.initialize(
                this.supabaseClient,
                this.currentPlayerId,
                'Host'
            );
            
            // Create room first
            const roomData = await PlayOnlineApp.createAndStartRoom();
            this.hideLoading();
            
            // Show test screen before lobby
            this.showScreen('testScreen');
            this.currentRoomCode = roomData.roomCode;
            
        } catch (error) {
            console.error('❌ Host game error:', error);
            this.hideLoading();
            this.showError(error.message || 'Error hosting game');
        }
    },
    
    async handleJoinGame() {
        try {
            const roomCode = document.getElementById('joinRoomCodeInput').value.trim();
            
            if (!roomCode || roomCode.length !== 4) {
                document.getElementById('joinCodeError').textContent = 'Please enter a valid 4-digit code';
                return;
            }
            
            // Generate unique player ID (UUID v4)
            this.currentPlayerId = generateUUID();
            console.log('✅ Join mode - Player ID:', this.currentPlayerId);
            
            this.showLoading('Joining game...');
            document.getElementById('joinCodeError').textContent = '';
            
            // Initialize app with guest
            await PlayOnlineApp.initialize(
                this.supabaseClient,
                this.currentPlayerId,
                'Guest'
            );
            
            // Join room
            const roomData = await PlayOnlineApp.joinRoom(roomCode);
            this.hideLoading();
            
            // Show test screen before lobby
            this.showScreen('testScreen');
            this.currentRoomCode = roomCode;
            
        } catch (error) {
            console.error('❌ Join game error:', error);
            this.hideLoading();
            document.getElementById('joinCodeError').textContent = error.message || 'Failed to join room';
        }
    },
    
    /**
     * CREATE ROOM FLOW
     */
    
    async handleCreateRoom() {
        try {
            this.showLoading('Creating room...');
            
            // Initialize app
            await PlayOnlineApp.initialize(
                this.supabaseClient,
                this.currentPlayerId,
                this.currentPlayerName
            );
            
            // Create room
            const roomData = await PlayOnlineApp.createAndStartRoom();
            
            this.hideLoading();
            
            // Show test screen
            await this.initializeTestScreen();
            this.showScreen('testScreen');
            
        } catch (error) {
            console.error('❌ Create room error:', error);
            this.hideLoading();
            this.showError('Failed to create room: ' + error.message);
        }
    },
    
    /**
     * JOIN ROOM FLOW
     */
    
    async handleJoinRoom() {
        try {
            const roomCode = document.getElementById('roomCodeInput').value.trim();
            
            if (roomCode.length !== 4) {
                document.getElementById('roomCodeError').textContent = 'Room code must be 4 digits';
                return;
            }
            
            this.showLoading('Joining room...');
            
            // Initialize app
            await PlayOnlineApp.initialize(
                this.supabaseClient,
                this.currentPlayerId,
                this.currentPlayerName
            );
            
            // Join room
            const roomData = await PlayOnlineApp.joinExistingRoom(roomCode);
            
            this.hideLoading();
            
            // Show test screen
            await this.initializeTestScreen();
            this.showScreen('testScreen');
            
        } catch (error) {
            console.error('❌ Join room error:', error);
            this.hideLoading();
            document.getElementById('roomCodeError').textContent = error.message;
        }
    },
    
    /**
     * TEST SCREEN
     */
    
    async initializeTestScreen() {
        try {
            const video = document.getElementById('testVideo');
            
            // Request camera and microphone
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            
            video.srcObject = stream;
            
            // Check audio level
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamAudioSource(stream);
            microphone.connect(analyser);
            
            document.getElementById('testAudioCheck').checked = true;
            document.getElementById('testVideoCheck').checked = true;
            
            console.log('✅ Test stream initialized');
            
        } catch (error) {
            console.error('❌ Test screen error:', error);
            const testError = document.getElementById('testError');
            testError.style.display = 'block';
            testError.textContent = 'Camera/Microphone access denied. Please check your browser permissions.';
            document.getElementById('testContinueBtn').disabled = true;
        }
    },
    
    async handleTestRetry() {
        try {
            const video = document.getElementById('testVideo');
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            await this.initializeTestScreen();
        } catch (error) {
            console.error('❌ Retry error:', error);
            this.showError('Failed to access camera/microphone');
        }
    },
    
    async handleTestContinue() {
        try {
            // Stop test video
            const video = document.getElementById('testVideo');
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            // Show lobby
            const roomData = PlayOnlineApp.roomManager.getCurrentRoom();
            document.getElementById('roomCodeDisplay').textContent = roomData.roomCode;
            document.getElementById('localPlayerLabel').textContent = this.currentPlayerName;
            document.getElementById('localVideoContainer').innerHTML = `
                <video id="localVideo" autoplay playsinline muted></video>
            `;
            
            this.showScreen('lobbyScreen');
            
        } catch (error) {
            console.error('❌ Continue error:', error);
            this.showError('Error proceeding to lobby');
        }
    },
    
    /**
     * LOBBY SCREEN
     */
    
    copyRoomCodeToClipboard() {
        const roomCode = document.getElementById('roomCodeDisplay').textContent;
        navigator.clipboard.writeText(roomCode).then(() => {
            const btn = document.getElementById('copyRoomCodeBtn');
            const original = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = original, 2000);
        });
    },
    
    async handleStartVideo() {
        try {
            this.showLoading('Starting video call...');
            this.startTime = Date.now();
            this.startCallTimer();
            this.hideLoading();
            this.showScreen('videoCallScreen');
        } catch (error) {
            console.error('❌ Start video error:', error);
            this.hideLoading();
            this.showError('Failed to start video call');
        }
    },
    
    async handleLeaveLobby() {
        try {
            this.showLoading('Leaving room...');
            await PlayOnlineApp.leaveRoom();
            this.hideLoading();
            this.showScreen('roomSelectScreen');
        } catch (error) {
            console.error('❌ Leave error:', error);
            this.hideLoading();
            this.showError('Error leaving room');
        }
    },
    
    /**
     * VIDEO CALL SCREEN
     */
    
    startCallTimer() {
        this.callTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('callDuration').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    },
    
    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
        }
    },
    
    async toggleMicrophone() {
        try {
            const btn = document.getElementById('micToggleBtn');
            const isEnabled = btn.classList.toggle('disabled');
            await PlayOnlineApp.toggleAudio(!isEnabled);
        } catch (error) {
            console.error('❌ Mic toggle error:', error);
        }
    },
    
    async toggleCamera() {
        try {
            const btn = document.getElementById('cameraToggleBtn');
            const isEnabled = btn.classList.toggle('disabled');
            await PlayOnlineApp.toggleVideo(!isEnabled);
        } catch (error) {
            console.error('❌ Camera toggle error:', error);
        }
    },
    
    async handleHangup() {
        try {
            this.stopCallTimer();
            
            this.showLoading('Ending call...');
            await PlayOnlineApp.leaveRoom();
            this.hideLoading();
            
            document.getElementById('finalDuration').textContent = 
                document.getElementById('callDuration').textContent;
            this.showScreen('endedScreen');
            
        } catch (error) {
            console.error('❌ Hangup error:', error);
            this.hideLoading();
            this.showError('Error ending call');
        }
    },
    
    /**
     * ENDED SCREEN
     */
    
    async handleNewCall() {
        this.showScreen('roomSelectScreen');
    },
    
    handleExitApp() {
        window.location.href = '../index/index.html';
    },
    
    /**
     * EVENT CALLBACKS
     */
    
    onPeerJoined(data) {
        console.log('👤 UI: Peer joined:', data);
        
        // Enable start button if we have at least 2 people
        const participants = document.querySelectorAll('.participant-item').length + 1;
        if (participants >= 2) {
            document.getElementById('startVideoBtn').disabled = false;
        }
        
        // Update participant count
        document.getElementById('participantCount').textContent = participants;
        
        // Add to participants list
        const participantsList = document.getElementById('participantsList');
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <span class="participant-name">${data.peerData.name}</span>
            <span class="participant-status connecting">🔄 Connecting...</span>
        `;
        item.id = `participant-${data.peerId}`;
        participantsList.appendChild(item);
    },
    
    onPeerVideoReady(data) {
        console.log('📹 UI: Peer video ready:', data.peerId);
        
        const item = document.getElementById(`participant-${data.peerId}`);
        if (item) {
            const status = item.querySelector('.participant-status');
            status.className = 'participant-status connected';
            status.textContent = '✅ Connected';
        }
    },
    
    onPeerLeft(data) {
        console.log('👋 UI: Peer left:', data.peerId);
        
        const item = document.getElementById(`participant-${data.peerId}`);
        if (item) {
            item.remove();
        }
        
        const count = document.querySelectorAll('.participant-item').length + 1;
        document.getElementById('participantCount').textContent = count;
    },
    
    onVideoRoomError(data) {
        console.error('⚠️ Video room error:', data.error);
        this.showError('Video connection error: ' + data.error.message);
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Play Online page loaded');
    
    // Wait for Supabase client to be ready
    let maxWaitTime = 15000; // 15 seconds
    let startTime = Date.now();
    
    while (!window.supabaseClient && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window.supabaseClient) {
        console.error('❌ Supabase client failed to initialize within timeout');
        PlayOnlineUI.showError('Failed to connect to database. Please refresh the page.');
        return;
    }
    
    // Supabase is ready - now initialize the app with authenticated user
    try {
        await PlayOnlineApp.initialize(window.supabaseClient);
        console.log('✅ PlayOnlineApp ready');
        
        // Initialize UI
        PlayOnlineUI.initialize();
    } catch (error) {
        console.error('❌ Failed to initialize PlayOnlineApp:', error);
        PlayOnlineUI.showError('Failed to initialize. Please ensure you are signed in.');
    }
});

console.log('📦 play-online.js loaded');
