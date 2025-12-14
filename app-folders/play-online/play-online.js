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
    mediaStream: null, // Store and reuse media stream
    
    // Camera settings
    cameraSettings: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0
    },
    
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
            
            // Add global click capture as safety net
            document.addEventListener('click', (e) => {
                if (e.target?.id === 'startVideoBtn') {
                    console.log('🎬 GLOBAL CLICK CAPTURE: Start Video Button clicked');
                    if (!this.handleStartVideo.__running) {
                        this.handleStartVideo.__running = true;
                        this.handleStartVideo().finally(() => {
                            this.handleStartVideo.__running = false;
                        });
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true); // useCapture = true to catch in capture phase
            
            console.log('✅ PlayOnlineUI initialized (with global click safety net)');
            
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
        document.getElementById('createRoomBtn')?.addEventListener('click', () => this.handleCreateRoom());
        document.getElementById('joinPromptBtn')?.addEventListener('click', () => this.showJoinCodeInput());
        document.getElementById('cancelJoinBtn')?.addEventListener('click', () => this.hideJoinCodeInput());
        document.getElementById('joinGameBtn')?.addEventListener('click', () => this.handleJoinGame());
        
        // Room Code Waiting Screen
        document.getElementById('copyGeneratedCodeBtn')?.addEventListener('click', () => this.copyGeneratedCodeToClipboard());
        document.getElementById('copyAndShareBtn')?.addEventListener('click', () => this.shareRoomCode());
        document.getElementById('backFromCodeBtn')?.addEventListener('click', () => this.handleBackFromCode());
        
        // Join code input - auto-format to 4 digits
        document.getElementById('joinRoomCodeInput')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        });
        
        // Device Config Screen
        document.getElementById('confirmDevicesBtn')?.addEventListener('click', () => this.handleConfirmDevices());
        document.getElementById('editSettingsBtn')?.addEventListener('click', () => this.openCameraSettings());
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeCameraSettings());
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => this.resetCameraSettings());
        document.getElementById('applySettingsBtn')?.addEventListener('click', () => this.applyCameraSettings());
        
        // Camera settings sliders
        document.getElementById('brightnessSlider')?.addEventListener('input', (e) => this.updateBrightness(e.target.value));
        document.getElementById('contrastSlider')?.addEventListener('input', (e) => this.updateContrast(e.target.value));
        document.getElementById('saturationSlider')?.addEventListener('input', (e) => this.updateSaturation(e.target.value));
        document.getElementById('hueSlider')?.addEventListener('input', (e) => this.updateHue(e.target.value));
        
        // Device selection in settings modal
        document.getElementById('settingsCameraSelect')?.addEventListener('change', (e) => this.onSettingsCameraChanged(e.target.value));
        document.getElementById('settingsMicrophoneSelect')?.addEventListener('change', (e) => this.onSettingsMicrophoneChanged(e.target.value));
        
        // Start Video Button - add with detailed logging and multiple fallbacks
        const startVideoBtn = document.getElementById('startVideoBtn');
        if (startVideoBtn) {
            console.log('✅ Start Video button found - attaching click handler');
            
            // Primary: click event
            startVideoBtn.addEventListener('click', () => {
                console.log('🎬 START VIDEO BUTTON CLICKED! (via click event)');
                PlayOnlineUI.handleStartVideo();
            });
            
            // Fallback 1: mousedown event
            startVideoBtn.addEventListener('mousedown', () => {
                console.log('🎬 START VIDEO BUTTON MOUSEDOWN! (fallback 1)');
                PlayOnlineUI.handleStartVideo();
            });
            
            // Fallback 2: pointerdown event  
            startVideoBtn.addEventListener('pointerdown', () => {
                console.log('🎬 START VIDEO BUTTON POINTERDOWN! (fallback 2)');
                PlayOnlineUI.handleStartVideo();
            });
            
            console.log('✅ All click handlers attached to Start Video button');
        } else {
            console.warn('⚠️ Start Video button NOT found in DOM');
        }
        
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
        window.addEventListener('peerJoined', (e) => PlayOnlineUI.onPeerJoined(e.detail));
        window.addEventListener('peerLeft', (e) => PlayOnlineUI.onPeerLeft(e.detail));
        window.addEventListener('peerVideoReady', (e) => {
            console.log('🎨 [UI] peerVideoReady event received! Detail:', e.detail);
            PlayOnlineUI.onPeerVideoReady(e.detail);
        });
        window.addEventListener('videoRoomError', (e) => PlayOnlineUI.onVideoRoomError(e.detail));
    },
    
    /**
     * Peer event handlers
     */
    onPeerJoined(detail) {
        console.log('🎨 UI: Peer joined event received', detail);
        // Add participant to the list
        this.updateParticipantsList(detail.peerId, detail.peerData.name, 'connecting');
    },
    
    onPeerVideoReady(detail) {
        console.log('🎨 PEER VIDEO READY HANDLER STARTING');
        console.log('🎨 Detail:', detail);
        console.log('🎨 peerId:', detail?.peerId);
        console.log('🎨 peerName:', detail?.peerName);
        console.log('🎨 stream:', !!detail?.stream);
        
        // Update participant status
        console.log('🎨 About to update participant');
        if (detail?.peerId && detail?.peerName) {
            this.updateParticipantsList(detail.peerId, detail.peerName, 'connected');
            console.log('✅ Participant updated');
        }
        
        // Find the container
        console.log('🎨 Looking for remoteVideosContainer');
        const container = document.getElementById('remoteVideosContainer');
        console.log('🎨 Container found:', !!container);
        
        if (!container) {
            console.error('❌ FATAL: remoteVideosContainer missing!');
            return;
        }
        
        // Get or create video element
        console.log('🎨 Looking for video element:', `video-${detail.peerId}`);
        let videoEl = document.getElementById(`video-${detail.peerId}`);
        console.log('🎨 Video element exists:', !!videoEl);
        
        if (!videoEl) {
            console.log('🎨 Creating video element');
            
            const wrapper = document.createElement('div');
            wrapper.className = 'video-grid-item remote';
            wrapper.id = `peer-video-${detail.peerId}`;
            
            videoEl = document.createElement('video');
            videoEl.id = `video-${detail.peerId}`;
            videoEl.autoplay = true;
            videoEl.playsinline = true;
            
            const label = document.createElement('div');
            label.className = 'video-label remote-label';
            label.textContent = detail.peerName || 'Guest';
            
            wrapper.appendChild(videoEl);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
            
            console.log('✅ Video element created');
        }
        
        // Set stream
        console.log('🎨 Setting stream on video element');
        if (detail?.stream) {
            console.log('🎨 Stream available, setting...');
            videoEl.srcObject = detail.stream;
            videoEl.play().then(() => {
                console.log('✅ Video playing');
            }).catch(e => {
                console.warn('⚠️ Play error:', e.message);
            });
        } else {
            console.warn('⚠️ No stream in detail');
        }
        
        // Enable button
        console.log('🎨 Enabling start button');
        const btn = document.getElementById('startVideoBtn');
        console.log('🎨 Button found:', !!btn);
        
        if (btn) {
            btn.disabled = false;
            console.log('✅ Button enabled - disabled prop is now:', btn.disabled);
        }
        
        console.log('🎨 HANDLER COMPLETE\n');
    },
    
    onPeerLeft(detail) {
        console.log('🎨 UI: Peer left, disabling Start Video Call button', detail);
        // Remove participant from list
        this.removeParticipantFromList(detail.peerId);
        
        const startBtn = document.getElementById('startVideoBtn');
        if (startBtn) {
            startBtn.disabled = true;
            console.log('⛔ Start Video Call button disabled');
        }
    },
    
    onVideoRoomError(detail) {
        console.error('🎨 UI: Video room error:', detail.error);
        this.showError('Video call error: ' + detail.error?.message || 'Unknown error');
    },
    
    updateParticipantsList(peerId, peerName, status) {
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;
        
        let participantEl = document.getElementById(`participant-${peerId}`);
        
        if (!participantEl) {
            // Create new participant element
            participantEl = document.createElement('div');
            participantEl.id = `participant-${peerId}`;
            participantEl.className = 'participant-item';
            participantEl.innerHTML = `
                <span class="participant-name">${peerName || 'Guest'}</span>
                <span class="participant-status ${status}">${status === 'connected' ? '🟢 Connected' : '⏳ Connecting'}</span>
            `;
            participantsList.appendChild(participantEl);
            
            // Update count
            const countEl = document.getElementById('participantCount');
            if (countEl) {
                const currentCount = parseInt(countEl.textContent) || 1;
                countEl.textContent = currentCount + 1;
            }
        } else if (status === 'connected') {
            // Update status
            const statusEl = participantEl.querySelector('.participant-status');
            if (statusEl) {
                statusEl.className = 'participant-status connected';
                statusEl.textContent = '🟢 Connected';
            }
        }
        
        console.log('📋 Participants list updated');
    },
    
    removeParticipantFromList(peerId) {
        const participantEl = document.getElementById(`participant-${peerId}`);
        if (participantEl) {
            participantEl.remove();
            
            // Update count
            const countEl = document.getElementById('participantCount');
            if (countEl) {
                const currentCount = parseInt(countEl.textContent) || 2;
                countEl.textContent = Math.max(1, currentCount - 1);
            }
        }
        
        console.log('📋 Participant removed from list');
    },
    
    /**
     * SCREEN MANAGEMENT
     */
    
    showScreen(screenId) {
        console.log('========== SCREEN TRANSITION DEBUG ==========');
        console.log('📱 showScreen() called with:', screenId);
        
        // Validate screen exists
        const screenEl = document.getElementById(screenId);
        console.log('✓ Target screen exists?', !!screenEl);
        
        if (!screenEl) {
            console.error('❌ Screen not found:', screenId);
            return;
        }
        
        // Remove active from all screens
        const allScreens = document.querySelectorAll('.screen');
        console.log('📊 Total screens on page:', allScreens.length);
        
        allScreens.forEach((screen, idx) => {
            const hadActive = screen.classList.contains('active');
            const screenName = screen.id || `unnamed-${idx}`;
            if (hadActive) {
                console.log(`  🔴 Removing active from: ${screenName}`);
            }
            screen.classList.remove('active');
        });
        
        // Add active to target screen
        screenEl.classList.add('active');
        console.log(`✅ Added active to: ${screenId}`);
        console.log(`✓ Screen now has active class?`, screenEl.classList.contains('active'));
        
        // Verify it's visible
        const style = window.getComputedStyle(screenEl);
        console.log(`✓ Screen display: ${style.display}`);
        console.log(`✓ Screen opacity: ${style.opacity}`);
        console.log(`✓ Screen visibility: ${style.visibility}`);
        
        console.log('========== END SCREEN TRANSITION ==========');
        
        // Load devices when showing lobby screen
        if (screenId === 'lobbyScreen') {
            console.log('🎯 Lobby screen detected - loading devices');
            this.loadDeviceList();
        }
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
    
    showJoinCodeInput() {
        try {
            document.getElementById('joinPromptBtn').style.display = 'none';
            document.getElementById('joinPromptText').style.display = 'none';
            document.getElementById('joinCodeContainer').style.display = 'block';
            document.getElementById('joinRoomCodeInput').focus();
        } catch (error) {
            console.error('❌ Error showing join input:', error);
        }
    },
    
    hideJoinCodeInput() {
        try {
            document.getElementById('joinPromptBtn').style.display = 'block';
            document.getElementById('joinPromptText').style.display = 'block';
            document.getElementById('joinCodeContainer').style.display = 'none';
            document.getElementById('joinRoomCodeInput').value = '';
            document.getElementById('joinCodeError').textContent = '';
        } catch (error) {
            console.error('❌ Error hiding join input:', error);
        }
    },
    
    async handleCreateRoom() {
        try {
            this.showLoading('Creating room...');
            
            // Just create the room in the database - DON'T initialize app yet
            const roomManager = PlayOnlineApp.roomManager || window.RoomManager;
            if (!roomManager) {
                throw new Error('Room manager not available');
            }
            
            // Initialize room manager if needed
            if (!roomManager.supabaseClient) {
                roomManager.supabaseClient = this.supabaseClient;
            }
            
            // Create room (just get the code, don't join it)
            const roomData = await roomManager.createRoom();
            
            this.hideLoading();
            
            // Store room code
            this.currentRoomCode = roomData.roomCode;
            console.log('🆕 Room created with code:', this.currentRoomCode);
            
            // Show the room code for 60 seconds
            document.getElementById('generatedRoomCode').textContent = this.currentRoomCode;
            this.showScreen('roomCodeWaitingScreen');
            
            // Start 60-second countdown
            this.startRoomCodeCountdown();
            
        } catch (error) {
            console.error('❌ Create room error:', error);
            this.hideLoading();
            this.showError('Failed to create room: ' + error.message);
        }
    },
    
    startRoomCodeCountdown() {
        let timeRemaining = 60;
        const timerEl = document.getElementById('countdownTimer');
        
        const countdown = setInterval(() => {
            timeRemaining--;
            timerEl.textContent = timeRemaining;
            
            if (timeRemaining <= 0) {
                clearInterval(countdown);
                this.handleRoomCodeExpired();
            }
        }, 1000);
        
        // Store interval ID so we can cancel it if user goes back
        this.roomCodeCountdownInterval = countdown;
    },
    
    handleRoomCodeExpired() {
        console.log('⏰ Room code expired');
        this.showError('Room code expired. Please create a new room.');
        this.currentRoomCode = null;
        this.showScreen('hostOrJoinScreen');
    },
    
    handleBackFromCode() {
        // Cancel countdown
        if (this.roomCodeCountdownInterval) {
            clearInterval(this.roomCodeCountdownInterval);
        }
        this.currentRoomCode = null;
        this.showScreen('hostOrJoinScreen');
    },
    
    copyGeneratedCodeToClipboard() {
        const code = document.getElementById('generatedRoomCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            // Show confirmation
            const btn = document.getElementById('copyGeneratedCodeBtn');
            const original = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = original;
            }, 2000);
        });
    },
    
    shareRoomCode() {
        const code = this.currentRoomCode;
        const text = `Join my DartStream game! Room code: ${code}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'DartStream Play Online',
                text: text
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(code);
            alert(`Code copied! Share this code with your opponent: ${code}`);
        }
    },
    
    async handleJoinGame() {
        try {
            const roomCode = document.getElementById('joinRoomCodeInput').value.trim();
            
            if (!roomCode || roomCode.length !== 4) {
                document.getElementById('joinCodeError').textContent = 'Please enter a valid 4-digit code';
                return;
            }
            
            // Hide the input and show loading
            this.hideJoinCodeInput();
            this.showLoading('Joining room...');
            document.getElementById('joinCodeError').textContent = '';
            
            // Generate unique player ID
            this.currentPlayerId = generateUUID();
            console.log('🔗 Joining room - Player ID:', this.currentPlayerId);
            
            // Initialize app without joining yet
            await PlayOnlineApp.initialize(this.supabaseClient);
            
            // Join room
            const roomData = await PlayOnlineApp.joinRoom(roomCode);
            
            this.hideLoading();
            
            // Store and display room code
            this.currentRoomCode = roomCode;
            document.getElementById('roomCodeDisplayConfig').textContent = this.currentRoomCode;
            
            console.log('✅ Joined room:', this.currentRoomCode);
            
            // Show device configuration screen
            this.showScreen('deviceConfigScreen');
            
            // Load available devices
            await this.loadDeviceList();
            
        } catch (error) {
            console.error('❌ Join game error:', error);
            this.hideLoading();
            document.getElementById('joinCodeError').textContent = error.message || 'Failed to join room';
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
            
            // Show lobby
            this.showScreen('lobbyScreen');
            
        } catch (error) {
            console.error('❌ Join room error:', error);
            this.hideLoading();
            document.getElementById('roomCodeError').textContent = error.message;
        }
    },
    
    /**
     * DEVICE CONFIGURATION (after joining room)
     */
    
    async handleConfirmDevices() {
        try {
            console.log('⚙️ Confirming devices - initializing video room');
            this.showLoading('Starting video...');
            
            // Check that we have room code and video room
            if (!this.currentRoomCode) {
                throw new Error('No room code set');
            }
            
            if (!PlayOnlineApp.videoRoom) {
                throw new Error('Video room not initialized');
            }
            
            // Get selected devices
            const selectedCameraId = document.getElementById('cameraSelect')?.value;
            const selectedMicId = document.getElementById('microphoneSelect')?.value;
            
            console.log('📸 Selected camera:', selectedCameraId);
            console.log('🎙️ Selected microphone:', selectedMicId);
            
            // Build constraints based on selected devices
            const constraints = {
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
                audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
            };
            
            console.log('📋 Media constraints:', constraints);
            
            // Initialize the video room with selected devices
            const localVideoContainer = document.getElementById('localVideoContainer');
            if (!localVideoContainer) {
                throw new Error('Local video container not found');
            }
            
            await PlayOnlineApp.videoRoom.initialize(
                this.currentRoomCode,
                this.currentPlayerId,
                'Player',
                localVideoContainer,
                null,  // No existing stream
                constraints
            );
            
            console.log('✅ Video room initialized with selected devices');
            
            // Set up event callbacks if not already done
            if (!PlayOnlineApp.videoRoom.onPeerVideoReady) {
                PlayOnlineApp.setupVideoRoomCallbacks();
            }
            
            this.hideLoading();
            
            // Show lobby/waiting screen with start button
            this.showScreen('lobbyScreen');
            
        } catch (error) {
            console.error('❌ Error confirming devices:', error);
            console.error('❌ Full error:', error.toString());
            console.error('❌ Stack:', error.stack);
            this.hideLoading();
            this.showError('Failed to initialize video: ' + (error?.message || error?.toString() || 'Unknown error'));
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
            console.log('========== START VIDEO CALL DEBUG ==========');
            console.log('🎬 handleStartVideo() CALLED!');
            
            // Check button state
            const startBtn = document.getElementById('startVideoBtn');
            console.log('🔘 Start button exists?', !!startBtn);
            console.log('🔘 Start button disabled?', startBtn?.disabled);
            console.log('🔘 Start button visible?', startBtn?.style.display !== 'none');
            
            // Check if app is initialized
            console.log('PlayOnlineApp state:', PlayOnlineApp?.getState?.());
            console.log('PlayOnlineApp videoRoom exists?', !!PlayOnlineApp?.videoRoom);
            console.log('PlayOnlineApp roomManager exists?', !!PlayOnlineApp?.roomManager);
            
            // Check local conditions
            console.log('Current player ID:', this.currentPlayerId);
            console.log('Current room code:', this.currentRoomCode);
            
            this.showLoading('Starting video call...');
            console.log('✅ Loading indicator shown');
            
            // Get the selected camera constraints
            const selectedConstraints = this.getMediaConstraints();
            console.log('📸 Selected camera constraints:', selectedConstraints);
            
            // If a camera was selected in settings, get a new stream with that camera
            if (this.selectedCameraId && PlayOnlineApp?.videoRoom?.localStream) {
                try {
                    console.log('🎥 Updating stream to use selected camera:', this.selectedCameraId);
                    const newStream = await navigator.mediaDevices.getUserMedia(selectedConstraints);
                    
                    // Stop old tracks
                    PlayOnlineApp.videoRoom.localStream.getTracks().forEach(track => {
                        if (track.kind === 'video') track.stop();
                    });
                    
                    // Add new video track to existing stream
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    if (newVideoTrack) {
                        // Replace video track
                        const sender = PlayOnlineApp.videoRoom.peerConnections?.[Object.keys(PlayOnlineApp.videoRoom.peerConnections || {})[0]]?.getSenders?.().find(s => s.track?.kind === 'video');
                        if (sender) {
                            await sender.replaceTrack(newVideoTrack);
                            console.log('✅ Video track replaced in peer connections');
                        }
                        
                        // Update local stream
                        const oldVideoTrack = PlayOnlineApp.videoRoom.localStream.getVideoTracks()[0];
                        if (oldVideoTrack) {
                            PlayOnlineApp.videoRoom.localStream.removeTrack(oldVideoTrack);
                            PlayOnlineApp.videoRoom.localStream.addTrack(newVideoTrack);
                            console.log('✅ Local stream updated with new video track');
                        }
                    }
                    
                    // Stop audio from new stream (we keep the original audio)
                    newStream.getAudioTracks().forEach(track => track.stop());
                } catch (error) {
                    console.warn('⚠️ Could not switch to selected camera:', error.message);
                }
            }
            
            this.startTime = Date.now();
            console.log('⏱️ Call timer started:', this.startTime);
            
            this.startCallTimer();
            console.log('✅ Timer callback registered');
            
            // Brief delay to ensure UI updates
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Delay completed');
            
            this.hideLoading();
            console.log('✅ Loading indicator hidden');
            
            console.log('📱 About to show videoCallScreen');
            const videoScreen = document.getElementById('videoCallScreen');
            console.log('📱 videoCallScreen exists?', !!videoScreen);
            
            this.showScreen('videoCallScreen');
            console.log('✅ videoCallScreen should now be visible');
            
            // Transfer local stream from lobby preview to video call element
            console.log('📸 Transferring local video stream...');
            const localVideoEl = document.getElementById('localVideo');
            if (localVideoEl && PlayOnlineApp?.videoRoom?.localStream) {
                localVideoEl.srcObject = PlayOnlineApp.videoRoom.localStream;
                console.log('✅ Local video stream transferred to #localVideo element');
                
                // Ensure video element is playing
                localVideoEl.play().then(() => {
                    console.log('▶️ Local video playback started');
                }).catch(err => {
                    console.warn('⚠️ Could not auto-play local video:', err.message);
                    // Try again after a short delay
                    setTimeout(() => {
                        localVideoEl.play().catch(e => console.error('❌ Auto-play failed:', e));
                    }, 100);
                });
            } else {
                console.warn('⚠️ Could not transfer local stream');
                console.log('   - localVideoEl exists?', !!localVideoEl);
                console.log('   - localStream exists?', !!PlayOnlineApp?.videoRoom?.localStream);
            }
            
            // Verify transition worked
            setTimeout(() => {
                const isActive = videoScreen?.classList.contains('active');
                console.log('📱 videoCallScreen has active class?', isActive);
                const style = window.getComputedStyle(videoScreen || document.body);
                console.log('📱 videoCallScreen display:', style.display);
                
                // Also verify local video is now playing
                const localVid = document.getElementById('localVideo');
                if (localVid) {
                    console.log('📹 Local video element srcObject exists?', !!localVid.srcObject);
                    console.log('📹 Local video readyState:', localVid.readyState);
                    console.log('📹 Local video paused?', localVid.paused);
                }
            }, 100);
            
            console.log('========== END VIDEO CALL DEBUG ==========');
            
        } catch (error) {
            console.error('========== START VIDEO ERROR ==========');
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Full error:', error);
            console.error('========== END ERROR ==========');
            
            this.hideLoading();
            this.showError('Failed to start video call: ' + error.message);
        }
    },
    
    async handleConfirmDevices() {
        try {
            console.log('✓ Device settings confirmed');
            // Hide the device selection, show the waiting for peers message
            const deviceSelection = document.querySelector('.device-selection');
            if (deviceSelection) {
                deviceSelection.style.display = 'none';
            }
            // Show the edit settings button
            document.getElementById('editSettingsBtn').style.display = 'inline-block';
            document.getElementById('lobbyStatusMessage').style.display = 'block';
        } catch (error) {
            console.error('❌ Confirm devices error:', error);
            this.showError('Error confirming device settings');
        }
    },
    
    openCameraSettings() {
        try {
            console.log('✓ Opening camera settings');
            // Populate device dropdowns in settings modal
            this.populateSettingsDevices();
            document.getElementById('cameraSettingsModal').style.display = 'flex';
        } catch (error) {
            console.error('❌ Open camera settings error:', error);
            this.showError('Error opening camera settings');
        }
    },
    
    async populateSettingsDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(d => d.kind === 'videoinput');
            const microphones = devices.filter(d => d.kind === 'audioinput');
            
            // Populate camera dropdown
            const cameraSelect = document.getElementById('settingsCameraSelect');
            cameraSelect.innerHTML = '';
            cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.textContent = camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
                cameraSelect.appendChild(option);
            });
            
            // Populate microphone dropdown
            const micSelect = document.getElementById('settingsMicrophoneSelect');
            micSelect.innerHTML = '';
            microphones.forEach(mic => {
                const option = document.createElement('option');
                option.value = mic.deviceId;
                option.textContent = mic.label || `Microphone ${microphones.indexOf(mic) + 1}`;
                micSelect.appendChild(option);
            });
            
            // Set current selections
            const cameraSelect2 = document.getElementById('cameraSelect');
            if (cameraSelect2.value) {
                cameraSelect.value = cameraSelect2.value;
            }
            const micSelect2 = document.getElementById('microphoneSelect');
            if (micSelect2.value) {
                micSelect.value = micSelect2.value;
            }
        } catch (error) {
            console.error('❌ Error populating settings devices:', error);
        }
    },
    
    onSettingsCameraChanged(deviceId) {
        try {
            // Also update the main camera select
            const mainCameraSelect = document.getElementById('cameraSelect');
            mainCameraSelect.value = deviceId;
            // Trigger the main camera change handler
            this.onCameraChanged(deviceId);
            console.log('✓ Camera changed in settings:', deviceId);
        } catch (error) {
            console.error('❌ Settings camera change error:', error);
        }
    },
    
    onSettingsMicrophoneChanged(deviceId) {
        try {
            // Also update the main microphone select
            const mainMicSelect = document.getElementById('microphoneSelect');
            mainMicSelect.value = deviceId;
            // Trigger the main microphone change handler
            this.onMicrophoneChanged(deviceId);
            console.log('✓ Microphone changed in settings:', deviceId);
        } catch (error) {
            console.error('❌ Settings microphone change error:', error);
        }
    },
    
    closeCameraSettings() {
        try {
            document.getElementById('cameraSettingsModal').style.display = 'none';
        } catch (error) {
            console.error('❌ Close camera settings error:', error);
        }
    },
    
    updateBrightness(value) {
        this.cameraSettings.brightness = parseInt(value);
        document.getElementById('brightnessValue').textContent = value + '%';
        this.applyCameraFilters();
    },
    
    updateContrast(value) {
        this.cameraSettings.contrast = parseInt(value);
        document.getElementById('contrastValue').textContent = value + '%';
        this.applyCameraFilters();
    },
    
    updateSaturation(value) {
        this.cameraSettings.saturation = parseInt(value);
        document.getElementById('saturationValue').textContent = value + '%';
        this.applyCameraFilters();
    },
    
    updateHue(value) {
        this.cameraSettings.hue = parseInt(value);
        document.getElementById('hueValue').textContent = value + '°';
        this.applyCameraFilters();
    },
    
    applyCameraFilters() {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            const { brightness, contrast, saturation, hue } = this.cameraSettings;
            localVideo.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
        }
    },
    
    resetCameraSettings() {
        try {
            this.cameraSettings = {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0
            };
            
            // Reset sliders
            document.getElementById('brightnessSlider').value = 100;
            document.getElementById('contrastSlider').value = 100;
            document.getElementById('saturationSlider').value = 100;
            document.getElementById('hueSlider').value = 0;
            
            // Reset labels
            document.getElementById('brightnessValue').textContent = '100%';
            document.getElementById('contrastValue').textContent = '100%';
            document.getElementById('saturationValue').textContent = '100%';
            document.getElementById('hueValue').textContent = '0°';
            
            this.applyCameraFilters();
            console.log('✓ Camera settings reset');
        } catch (error) {
            console.error('❌ Reset settings error:', error);
        }
    },
    
    applyCameraSettings() {
        try {
            console.log('✓ Camera settings applied:', this.cameraSettings);
            this.closeCameraSettings();
        } catch (error) {
            console.error('❌ Apply settings error:', error);
            this.showError('Error applying camera settings');
        }
    },
    
    async handleLeaveLobby() {
        try {
            this.showLoading('Leaving room...');
            
            // Stop camera preview stream
            if (this.previewStream) {
                this.previewStream.getTracks().forEach(track => track.stop());
                this.previewStream = null;
            }
            
            // Leave room
            await PlayOnlineApp.leaveRoom();
            this.hideLoading();
            
            // Return to main host/join screen
            this.showScreen('hostOrJoinScreen');
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
    },
    
    /**
     * DEVICE SELECTION
     */
    
    async loadDeviceList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const cameras = devices.filter(device => device.kind === 'videoinput');
            const microphones = devices.filter(device => device.kind === 'audioinput');
            
            // Populate camera select
            const cameraSelect = document.getElementById('cameraSelect');
            if (cameraSelect) {
                cameraSelect.innerHTML = '';
                if (cameras.length > 0) {
                    cameras.forEach(camera => {
                        const option = document.createElement('option');
                        option.value = camera.deviceId;
                        option.textContent = camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
                        cameraSelect.appendChild(option);
                    });
                    cameraSelect.addEventListener('change', (e) => this.onCameraChanged(e.target.value));
                    
                    // Start with first camera by default
                    if (cameras.length > 0) {
                        cameraSelect.value = cameras[0].deviceId;
                        await this.startCameraPreview(cameras[0].deviceId);
                    }
                } else {
                    cameraSelect.innerHTML = '<option>No cameras found</option>';
                }
            }
            
            // Populate microphone select
            const micSelect = document.getElementById('microphoneSelect');
            if (micSelect) {
                micSelect.innerHTML = '';
                if (microphones.length > 0) {
                    microphones.forEach(mic => {
                        const option = document.createElement('option');
                        option.value = mic.deviceId;
                        option.textContent = mic.label || `Microphone ${microphones.indexOf(mic) + 1}`;
                        micSelect.appendChild(option);
                    });
                    micSelect.addEventListener('change', (e) => this.onMicrophoneChanged(e.target.value));
                    
                    // Test first microphone by default
                    if (microphones.length > 0) {
                        micSelect.value = microphones[0].deviceId;
                        await this.testDevice('audio', microphones[0].deviceId);
                    }
                } else {
                    micSelect.innerHTML = '<option>No microphones found</option>';
                }
            }
            
            console.log(`✅ Loaded ${cameras.length} cameras and ${microphones.length} microphones`);
        } catch (error) {
            console.error('❌ Error loading devices:', error);
        }
    },
    
    async startCameraPreview(deviceId) {
        try {
            // Stop previous stream if exists
            if (this.previewStream) {
                this.previewStream.getTracks().forEach(track => track.stop());
            }
            
            // Get media stream with specific camera
            this.previewStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: false
            });
            
            // Create or reuse video element
            let videoElement = document.getElementById('previewVideo');
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.id = 'previewVideo';
                videoElement.autoplay = true;
                videoElement.playsinline = true;
                videoElement.muted = true;
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.borderRadius = '8px';
                videoElement.style.objectFit = 'cover';
                
                const container = document.getElementById('localVideoContainer');
                container.innerHTML = '';
                container.appendChild(videoElement);
            }
            
            // Attach stream to video element
            videoElement.srcObject = this.previewStream;
            
            // Update status
            document.getElementById('cameraStatus').textContent = '🟢 Connected';
            document.getElementById('cameraStatus').classList.remove('disconnected');
            document.getElementById('cameraStatus').classList.add('connected');
            
            console.log('✅ Camera preview started');
        } catch (error) {
            console.error('❌ Camera preview error:', error);
            document.getElementById('cameraStatus').textContent = '🔴 Disconnected';
            document.getElementById('cameraStatus').classList.add('disconnected');
            document.getElementById('cameraStatus').classList.remove('connected');
        }
    },
    
    async onCameraChanged(deviceId) {
        console.log('📹 Camera changed to:', deviceId);
        this.selectedCameraId = deviceId;
        
        // Start preview with new camera
        await this.startCameraPreview(deviceId);
    },
    
    async onMicrophoneChanged(deviceId) {
        console.log('🎙️ Microphone changed to:', deviceId);
        this.selectedMicrophoneId = deviceId;
        
        // Test the microphone
        console.log('⏳ Testing microphone...', deviceId);
        await this.testDevice('audio', deviceId);
        console.log('✓ Microphone test completed');
    },
    
    async testDevice(kind, deviceId) {
        try {
            console.log(`🔧 Testing ${kind} device: ${deviceId}`);
            
            const constraints = kind === 'video' 
                ? { video: { deviceId: { exact: deviceId } } }
                : { audio: { deviceId: { exact: deviceId } } };
            
            console.log(`📡 Requesting ${kind} permissions with constraints:`, constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log(`✅ ${kind} stream acquired successfully:`, stream);
            
            // Update status indicator
            if (kind === 'video') {
                const statusEl = document.getElementById('cameraStatus');
                if (statusEl) {
                    statusEl.className = 'device-status connected';
                    statusEl.textContent = '🟢 Connected';
                }
                
                // Display the camera feed
                const videoEl = document.getElementById('localVideo');
                if (videoEl) {
                    videoEl.srcObject = stream;
                    console.log('📺 Camera feed displaying');
                }
            } else {
                console.log('🎙️ Updating microphone status indicator...');
                const statusEl = document.getElementById('microphoneStatus');
                console.log('Status element found:', statusEl ? 'YES' : 'NO');
                if (statusEl) {
                    statusEl.className = 'device-status connected';
                    statusEl.textContent = '🟢 Connected';
                    console.log('✅ Microphone status updated to CONNECTED');
                }
                
                // Store the audio stream for later use and stop it briefly
                if (!this.audioTestStream) {
                    this.audioTestStream = stream;
                } else {
                    // Stop old audio stream
                    this.audioTestStream.getTracks().forEach(track => track.stop());
                    this.audioTestStream = stream;
                }
                console.log('✅ Microphone connected and ready');
            }
            
            // Store media stream for later use if needed
            if (!this.mediaStream && kind === 'video') {
                this.mediaStream = stream;
            }
            
        } catch (error) {
            console.error(`❌ Error testing ${kind}:`, error.name, error.message);
            
            if (kind === 'video') {
                const statusEl = document.getElementById('cameraStatus');
                if (statusEl) {
                    statusEl.className = 'device-status disconnected';
                    statusEl.textContent = '🔴 Disconnected';
                }
            } else {
                const statusEl = document.getElementById('microphoneStatus');
                console.log('Setting microphone status to disconnected, element:', statusEl ? 'found' : 'not found');
                if (statusEl) {
                    statusEl.className = 'device-status disconnected';
                    statusEl.textContent = '🔴 Disconnected';
                    console.log('Microphone status updated to DISCONNECTED due to error');
                }
            }
        }
    },
    
    getMediaConstraints() {
        const constraints = {
            audio: true,
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        // Apply selected devices if available
        if (this.selectedCameraId) {
            constraints.video.deviceId = { exact: this.selectedCameraId };
        }
        if (this.selectedMicrophoneId) {
            constraints.audio = {
                deviceId: { exact: this.selectedMicrophoneId }
            };
        }
        
        return constraints;
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

// ============ DEBUG FUNCTIONS ============

function addDebugLog(message, type = 'info') {
    const debugOutput = document.getElementById('debugOutput');
    if (!debugOutput) return;
    
    const entry = document.createElement('div');
    entry.className = `debug-log ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    debugOutput.appendChild(entry);
    debugOutput.scrollTop = debugOutput.scrollHeight;
}

function clearDebugLogs() {
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
        debugOutput.innerHTML = '';
        addDebugLog('🧹 Logs cleared', 'info');
    }
}

function testScreenTransition() {
    addDebugLog('========== SCREEN TRANSITION TEST ==========', 'debug');
    
    const allScreens = document.querySelectorAll('.screen');
    addDebugLog(`Found ${allScreens.length} screen elements`, 'info');
    
    allScreens.forEach((screen, idx) => {
        addDebugLog(`  Screen ${idx}: ${screen.id}`, 'debug');
    });
    
    const videoCallScreen = document.getElementById('videoCallScreen');
    if (!videoCallScreen) {
        addDebugLog('❌ videoCallScreen not found!', 'error');
        return;
    }
    
    addDebugLog('✓ videoCallScreen found', 'info');
    
    // Test transition
    allScreens.forEach(s => s.classList.remove('active'));
    videoCallScreen.classList.add('active');
    
    const hasActive = videoCallScreen.classList.contains('active');
    const style = window.getComputedStyle(videoCallScreen);
    
    addDebugLog(`✓ Active class: ${hasActive}`, hasActive ? 'info' : 'error');
    addDebugLog(`Display: ${style.display}`, 'debug');
    addDebugLog(`Opacity: ${style.opacity}`, 'debug');
    
    setTimeout(() => {
        // Reset screens
        allScreens.forEach(s => s.classList.remove('active'));
        document.getElementById('hostOrJoinScreen')?.classList.add('active');
        addDebugLog('✓ Screens reset', 'info');
        addDebugLog('========== END TEST ==========', 'debug');
    }, 1000);
}

function testStartVideo() {
    addDebugLog('========== START VIDEO TEST ==========', 'debug');
    addDebugLog('🎬 Testing handleStartVideo()', 'info');
    PlayOnlineUI.handleStartVideo().catch(err => {
        addDebugLog(`Error: ${err.message}`, 'error');
    });
    addDebugLog('========== END TEST ==========', 'debug');
}

// Toggle debug panel with 'D' key
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'flex' : 'none';
        }
    }
});

// Intercept console logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(msg) {
    originalLog(msg);
    if (typeof msg === 'string') {
        addDebugLog(msg, 'info');
    }
};

console.error = function(msg) {
    originalError(msg);
    if (typeof msg === 'string') {
        addDebugLog(msg, 'error');
    }
};

console.warn = function(msg) {
    originalWarn(msg);
    if (typeof msg === 'string') {
        addDebugLog(msg, 'warn');
    }
};
