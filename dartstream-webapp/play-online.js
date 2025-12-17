/**
 * PlayOnlineV7 - Fresh, clean implementation
 * Simple flow: Create/Join → Device Config → Video Call
 */

class PlayOnlineV7 {
    constructor() {
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.roomManager = null;
        this.videoRoom = null;
        this.currentRoomCountdown = null;
        this.devices = { cameras: [], microphones: [] };
        this.selectedDevices = { camera: null, microphone: null };
        this.mediaStream = null;
        this.micEnabled = true;
        this.cameraEnabled = true;
        this.isSettingsMode = false;
        
        // Dragging state
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Connection tracking
        this.connectionStartTime = null;
        this.connectionTimerInterval = null;
        this.connectionAutoHideTimer = null;

        this.initializeElements();
        this.setupEventListeners();
        this.initializeModules();
    }

    initializeElements() {
        // Screens
        this.screens = {
            start: document.getElementById('startScreen'),
            roomCode: document.getElementById('roomCodeScreen'),
            join: document.getElementById('joinScreen'),
            deviceConfig: document.getElementById('deviceConfigScreen'),
            videoCall: document.getElementById('videoCallScreen'),
        };

        // Buttons
        this.buttons = {
            createRoom: document.getElementById('createRoomBtn'),
            joinRoom: document.getElementById('joinRoomBtn'),
            copyCode: document.getElementById('copyCodeBtn'),
            joinRoomCode: document.getElementById('joinRoomCodeBtn'),
            cancelRoom: document.getElementById('cancelRoomBtn'),
            joinGame: document.getElementById('joinGameBtn'),
            backToStart: document.getElementById('backToStartBtn'),
            confirmDevices: document.getElementById('confirmDevicesBtn'),
            cancelDevices: document.getElementById('cancelDevicesBtn'),
            toggleMic: document.getElementById('toggleMicBtn'),
            toggleCamera: document.getElementById('toggleCameraBtn'),
            settings: document.getElementById('settingsBtn'),
            refreshCall: document.getElementById('refreshCallBtn'),
            endCall: document.getElementById('endCallBtn'),
        };

        // Inputs
        this.inputs = {
            roomCode: document.getElementById('roomCodeInput'),
            camera: document.getElementById('cameraSelect'),
            microphone: document.getElementById('microphoneSelect'),
        };

        // Video elements
        this.video = {
            localPreview: document.getElementById('cameraPreview'),
            local: document.getElementById('localVideo'),
            remote: document.getElementById('remoteVideo'),
        };

        // Display elements
        this.display = {
            roomCode: document.getElementById('roomCodeDisplay'),
            countdown: document.getElementById('roomCountdown'),
            error: document.getElementById('errorMessage'),
            opponentName: document.getElementById('opponentName'),
            youName: document.getElementById('youName'),
            connectionBanner: document.getElementById('connectionBanner'),
            connectionStatus: document.getElementById('connectionStatus'),
            connectionTimer: document.getElementById('connectionTimer'),
        };
    }

    setupEventListeners() {
        // Start screen
        this.buttons.createRoom.addEventListener('click', () => this.handleCreateRoom());
        this.buttons.joinRoom.addEventListener('click', () => this.showScreen('join'));

        // Room code screen
        this.buttons.cancelRoom.addEventListener('click', () => this.cancelRoomCreation());
        this.buttons.copyCode.addEventListener('click', () => this.copyRoomCode());
        this.buttons.joinRoomCode.addEventListener('click', () => this.autoJoinAsHost());

        // Join screen
        this.buttons.joinGame.addEventListener('click', () => this.handleJoinRoom());
        this.buttons.backToStart.addEventListener('click', () => this.showScreen('start'));
        this.inputs.roomCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinRoom();
        });

        // Device config screen
        this.buttons.confirmDevices.addEventListener('click', () => this.handleConfirmDevices());
        this.buttons.cancelDevices.addEventListener('click', () => this.cancelDeviceConfig());
        this.inputs.camera.addEventListener('change', () => this.previewCamera());
        this.inputs.microphone.addEventListener('change', () => {
            this.selectedDevices.microphone = this.inputs.microphone.value;
        });

        // Video call controls
        this.buttons.toggleMic.addEventListener('click', () => this.toggleMicrophone());
        this.buttons.toggleCamera.addEventListener('click', () => this.toggleCamera());
        this.buttons.settings.addEventListener('click', () => this.showDeviceSettings());
        this.buttons.refreshCall.addEventListener('click', () => this.refreshCall());
        this.buttons.endCall.addEventListener('click', () => this.endCall());

        // Local video dragging - set up after DOM is ready
        setTimeout(() => this.setupLocalVideoDrag(), 100);
    }

    setupLocalVideoDrag() {
        const localVideoContainer = document.querySelector('.local-video-container');
        if (!localVideoContainer) return;

        localVideoContainer.addEventListener('mousedown', (e) => this.onVideoDragStart(e, localVideoContainer));
        localVideoContainer.addEventListener('touchstart', (e) => this.onVideoDragStart(e, localVideoContainer));
        
        document.addEventListener('mousemove', (e) => this.onVideoDrag(e, localVideoContainer));
        document.addEventListener('touchmove', (e) => this.onVideoDrag(e, localVideoContainer), { passive: false });
        
        document.addEventListener('mouseup', () => this.onVideoDragEnd(localVideoContainer));
        document.addEventListener('touchend', () => this.onVideoDragEnd(localVideoContainer));
    }

    onVideoDragStart(e, el) {
        this.isDragging = true;
        el.classList.add('dragging');
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = el.getBoundingClientRect();
        this.dragOffsetX = clientX - rect.left;
        this.dragOffsetY = clientY - rect.top;
        
        e.preventDefault();
    }

    onVideoDrag(e, el) {
        if (!this.isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - this.dragOffsetX;
        const y = clientY - this.dragOffsetY;
        
        el.style.left = Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth)) + 'px';
        el.style.top = Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight)) + 'px';
        el.style.right = 'auto';
        
        e.preventDefault();
    }

    onVideoDragEnd(el) {
        this.isDragging = false;
        el.classList.remove('dragging');
    }

    async initializeModules() {
        // Wait for Supabase to load (CDN is async, may take a moment)
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.supabaseClient) {
            this.showError('Failed to connect to Supabase');
            console.error('❌ Supabase client never initialized after', maxAttempts * 100, 'ms');
            return;
        }

        // Initialize room manager with Supabase client
        this.roomManager = window.RoomManager;
        if (!this.roomManager) {
            this.showError('Room manager not loaded');
            return;
        }

        try {
            await this.roomManager.initialize(window.supabaseClient);
        } catch (err) {
            console.error('❌ Failed to initialize room manager:', err);
            this.showError('Failed to initialize room manager: ' + err.message);
            return;
        }

        // Generate player ID
        this.playerId = this.generatePlayerId();

        // Load available devices
        await this.loadDevices();

        console.log('✅ PlayOnlineV7 initialized');
    }

    async loadDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            this.devices.cameras = devices.filter(d => d.kind === 'videoinput');
            this.devices.microphones = devices.filter(d => d.kind === 'audioinput');

            // Populate dropdowns (will be needed later)
            this.updateDeviceSelects();
        } catch (err) {
            console.error('❌ Failed to enumerate devices:', err);
        }
    }

    updateDeviceSelects() {
        // Camera select
        this.inputs.camera.innerHTML = '';
        this.devices.cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `Camera ${this.inputs.camera.children.length + 1}`;
            this.inputs.camera.appendChild(option);
        });

        if (this.devices.cameras.length > 0) {
            this.selectedDevices.camera = this.devices.cameras[0].deviceId;
            this.inputs.camera.value = this.selectedDevices.camera;
        }

        // Microphone select
        this.inputs.microphone.innerHTML = '';
        this.devices.microphones.forEach(mic => {
            const option = document.createElement('option');
            option.value = mic.deviceId;
            option.textContent = mic.label || `Microphone ${this.inputs.microphone.children.length + 1}`;
            this.inputs.microphone.appendChild(option);
        });

        if (this.devices.microphones.length > 0) {
            this.selectedDevices.microphone = this.devices.microphones[0].deviceId;
            this.inputs.microphone.value = this.selectedDevices.microphone;
        }
    }

    async previewCamera() {
        try {
            this.selectedDevices.camera = this.inputs.camera.value;

            // Stop existing preview
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }

            // Get preview stream with high resolution
            const constraints = {
                video: {
                    deviceId: { exact: this.selectedDevices.camera },
                    width: { min: 1280, ideal: 1920, max: 3840 },
                    height: { min: 720, ideal: 1080, max: 2160 }
                },
                audio: false,
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.localPreview.srcObject = this.mediaStream;
        } catch (err) {
            console.error('❌ Camera preview failed:', err);
            this.showError('Failed to access camera');
        }
    }

    async handleCreateRoom() {
        try {
            const result = await this.roomManager.createRoom();
            this.roomCode = result.roomCode;
            this.playerName = 'Host'; // Default name for creator
            this.display.roomCode.textContent = result.roomCode;

            // Show code for 60 seconds, then auto-join
            this.showScreen('roomCode');
            this.startRoomCountdown();
            
            // After 3 seconds, auto-join the room as host
            setTimeout(() => {
                if (this.roomCode === result.roomCode) {
                    this.autoJoinAsHost();
                }
            }, 3000);
        } catch (err) {
            console.error('❌ Create room failed:', err);
            this.showError('Failed to create room: ' + err.message);
        }
    }

    async autoJoinAsHost() {
        try {
            // Join as host to the room just created
            await this.roomManager.joinRoom(this.roomCode, this.playerName);
            
            // Stop the countdown timer - user has progressed past the room code screen
            this.stopRoomCountdown();
            
            // Show device config screen
            this.showScreen('deviceConfig');
            await this.loadDevices();
            this.updateDeviceSelects();
            await this.previewCamera();
        } catch (err) {
            console.error('❌ Auto-join failed:', err);
        }
    }

    startRoomCountdown() {
        let seconds = 60;
        this.display.countdown.textContent = `Expires in ${seconds} seconds`;

        this.currentRoomCountdown = setInterval(() => {
            seconds--;
            this.display.countdown.textContent = `Expires in ${seconds} seconds`;

            if (seconds <= 0) {
                clearInterval(this.currentRoomCountdown);
                this.cancelRoomCreation();
            }
        }, 1000);
    }

    cancelRoomCreation() {
        if (this.currentRoomCountdown) {
            clearInterval(this.currentRoomCountdown);
            this.currentRoomCountdown = null;
        }
        this.roomCode = null;
        this.showScreen('start');
    }
    
    stopRoomCountdown() {
        // Stop the countdown timer once user moves past the room code screen
        if (this.currentRoomCountdown) {
            clearInterval(this.currentRoomCountdown);
            this.currentRoomCountdown = null;
            console.log('⏹️  Room countdown stopped - user has progressed past code screen');
        }
    }

    copyRoomCode() {
        if (!this.roomCode) {
            this.showError('No room code to copy');
            return;
        }
        
        navigator.clipboard.writeText(this.roomCode).then(() => {
            console.log('✅ Room code copied to clipboard:', this.roomCode);
            // Show feedback
            const btn = this.buttons.copyCode;
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = this.roomCode;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const btn = this.buttons.copyCode;
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    async handleJoinRoom() {
        const code = this.inputs.roomCode.value.trim().toUpperCase();

        if (!code || code.length !== 4) {
            this.showError('Enter a valid 4-digit room code');
            return;
        }

        try {
            this.playerName = 'Guest'; // Default name for joiner
            this.roomCode = code;

            // Join the room
            const room = await this.roomManager.joinRoom(code, this.playerName);

            if (!room) {
                this.showError('Room not found or expired');
                return;
            }

            // Show device config screen
            this.showScreen('deviceConfig');
            await this.loadDevices();
            this.updateDeviceSelects();
            await this.previewCamera();
        } catch (err) {
            console.error('❌ Join room failed:', err);
            this.showError('Failed to join room: ' + err.message);
        }
    }

    cancelDeviceConfig() {
        // Stop preview stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        this.roomCode = null;
        this.inputs.roomCode.value = '';
        this.showScreen('start');
    }

    async handleConfirmDevices() {
        if (!this.selectedDevices.camera || !this.selectedDevices.microphone) {
            this.showError('Select both camera and microphone');
            return;
        }

        try {
            // High resolution constraints
            const constraints = {
                video: {
                    deviceId: { exact: this.selectedDevices.camera },
                    width: { min: 1280, ideal: 1920, max: 3840 },
                    height: { min: 720, ideal: 1080, max: 2160 }
                },
                audio: { deviceId: { exact: this.selectedDevices.microphone } },
            };

            // If we're in settings mode, update devices and reconnect to video call
            if (this.isSettingsMode) {
                // Stop old stream
                if (this.mediaStream) {
                    this.mediaStream.getTracks().forEach(track => track.stop());
                }

                // Disconnect from current video room
                if (this.videoRoom) {
                    await this.videoRoom.leaveRoom();
                    // Reset VideoRoom state to force complete re-initialization
                    this.videoRoom.realtimeChannel = null;
                    this.videoRoom.roomCode = null;
                    this.videoRoom.peers = {};
                }

                // Reconnect with new settings - use the VideoRoom object directly
                await window.VideoRoom.initialize(
                    this.roomCode,
                    this.playerId,
                    this.playerName,
                    this.video.local,
                    null,  // Don't reuse stream, get fresh one with new constraints
                    constraints
                );

                this.mediaStream = window.VideoRoom.localStream;
                this.videoRoom = window.VideoRoom;

                // Set up callbacks again
                this.videoRoom.onPeerJoined = (peerId, peerName) => {
                    console.log('✅ Peer rejoined after settings change:', peerId, peerName);
                    this.display.opponentName.textContent = peerName || 'Opponent';
                    // Show connection successful banner
                    this.showConnectionSuccess();
                };

                this.videoRoom.onPeerVideoReady = (peerId, stream) => {
                    console.log('📹 Peer video ready after settings change:', peerId);
                    if (this.video.remote) {
                        this.video.remote.srcObject = stream;
                    }
                };

                this.videoRoom.onPeerLeft = (peerId) => {
                    console.log('👋 Peer left after settings change:', peerId);
                    this.display.opponentName.textContent = 'Opponent (disconnected)';
                    if (this.video.remote) {
                        this.video.remote.srcObject = null;
                    }
                };

                // Reset media states
                this.micEnabled = true;
                this.cameraEnabled = true;
                this.buttons.toggleMic.textContent = '🎤';
                this.buttons.toggleCamera.textContent = '📷';

                this.isSettingsMode = false;
                this.showScreen('videoCall');
                this.setupConnectionStatusListener();
                this.showError('Settings updated and reconnected!');
                console.log('✅ Settings updated and video call reconnected');
                return;
            }

            // Normal flow: Initialize video room with selected devices
            // Clear preview
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }

            // Initialize video room using the VideoRoom object
            await window.VideoRoom.initialize(
                this.roomCode,
                this.playerId,
                this.playerName,
                this.video.local,
                null,  // existingStream - let it create new one
                constraints
            );

            // Store the stream for later use
            this.mediaStream = window.VideoRoom.localStream;
            this.videoRoom = window.VideoRoom;

            // Set up callbacks
            this.videoRoom.onPeerJoined = (peerId, peerName) => {
                console.log('✅ Peer joined:', peerId, peerName);
                this.display.opponentName.textContent = peerName || 'Opponent';
                // Show connection successful banner
                this.showConnectionSuccess();
            };

            this.videoRoom.onPeerVideoReady = (peerId, stream) => {
                console.log('📹 Peer video ready:', peerId);
                if (this.video.remote) {
                    this.video.remote.srcObject = stream;
                }
            };

            this.videoRoom.onPeerLeft = (peerId) => {
                console.log('👋 Peer left:', peerId);
                this.display.opponentName.textContent = 'Opponent (disconnected)';
                if (this.video.remote) {
                    this.video.remote.srcObject = null;
                }
            };

            // Show video call screen and start connection tracking
            this.showScreen('videoCall');
            this.display.youName.textContent = this.playerName || 'You';
            
            // Start connection timer and setup connection status listener
            this.startConnectionTracking();
            this.setupConnectionStatusListener();

            console.log('✅ Device confirmation successful - video call started');
        } catch (err) {
            console.error('❌ Device confirmation failed:', err);
            this.showError('Failed to start video call: ' + err.message);
        }
    }

    toggleMicrophone() {
        if (!this.videoRoom || !this.videoRoom.localStream) return;

        this.micEnabled = !this.micEnabled;
        const btn = this.buttons.toggleMic;

        this.videoRoom.localStream.getAudioTracks().forEach(track => {
            track.enabled = this.micEnabled;
        });

        btn.textContent = this.micEnabled ? '🎤' : '🔇';
        btn.classList.toggle('off');
    }

    toggleCamera() {
        if (!this.videoRoom || !this.videoRoom.localStream) return;

        this.cameraEnabled = !this.cameraEnabled;
        const btn = this.buttons.toggleCamera;

        this.videoRoom.localStream.getVideoTracks().forEach(track => {
            track.enabled = this.cameraEnabled;
        });

        btn.textContent = this.cameraEnabled ? '📷' : '🚫';
        btn.classList.toggle('off');
    }

    showDeviceSettings() {
        // Store current video room and media stream
        const currentVideoRoom = this.videoRoom;
        const currentStream = this.mediaStream;

        // Show device config screen but mark it as settings mode
        this.isSettingsMode = true;
        this.showScreen('deviceConfig');

        // Pre-populate with current selections
        if (this.selectedDevices.camera) {
            this.inputs.camera.value = this.selectedDevices.camera;
        }
        if (this.selectedDevices.microphone) {
            this.inputs.microphone.value = this.selectedDevices.microphone;
        }

        // Preview the camera
        this.previewCamera();
    }

    async refreshCall() {
        if (!this.videoRoom) return;

        this.showError('Refreshing video call...');

        try {
            // Disconnect from current call
            await this.videoRoom.leaveRoom();

            // Fully reset VideoRoom state to force complete re-initialization
            this.videoRoom.realtimeChannel = null;
            this.videoRoom.roomCode = null;
            this.videoRoom.peers = {};
            
            // Stop old stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }

            // Reconnect to same room with high resolution - this will now fully re-initialize
            await this.videoRoom.initialize(
                this.roomCode,
                this.playerId,
                this.playerName,
                this.video.local,
                null,  // Get fresh stream
                {
                    video: {
                        deviceId: { exact: this.selectedDevices.camera },
                        width: { min: 1280, ideal: 1920, max: 3840 },
                        height: { min: 720, ideal: 1080, max: 2160 }
                    },
                    audio: { deviceId: { exact: this.selectedDevices.microphone } },
                }
            );

            this.mediaStream = this.videoRoom.localStream;

            // Set up callbacks for peer events
            this.videoRoom.onPeerJoined = (peerId, peerName) => {
                console.log('✅ Peer rejoined after refresh:', peerId, peerName);
                this.display.opponentName.textContent = peerName || 'Opponent';
                // Show connection successful banner
                this.showConnectionSuccess();
            };

            this.videoRoom.onPeerVideoReady = (peerId, stream) => {
                console.log('📹 Peer video ready after refresh:', peerId);
                if (this.video.remote) {
                    this.video.remote.srcObject = stream;
                }
            };

            this.videoRoom.onPeerLeft = (peerId) => {
                console.log('👋 Peer left after refresh:', peerId);
                this.display.opponentName.textContent = 'Opponent (disconnected)';
                if (this.video.remote) {
                    this.video.remote.srcObject = null;
                }
            };

            // Reset media states
            this.micEnabled = true;
            this.cameraEnabled = true;
            this.buttons.toggleMic.textContent = '🎤';
            this.buttons.toggleCamera.textContent = '📷';

            // Setup connection status listener for refresh scenario
            this.setupConnectionStatusListener();

            this.showError('Video call refreshed successfully!');

            console.log('✅ Video call refreshed');
        } catch (err) {
            console.error('❌ Refresh failed:', err);
            this.showError('Failed to refresh call: ' + err.message);
        }
    }

    async endCall() {
        if (this.videoRoom) {
            await this.videoRoom.leaveRoom();
        }

        // Stop all media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        // Stop connection tracking
        this.stopConnectionTracking();

        // Reset
        this.roomCode = null;
        this.playerId = this.generatePlayerId();
        this.inputs.roomCode.value = '';
        this.isSettingsMode = false
        this.playerId = this.generatePlayerId();
        this.inputs.roomCode.value = '';

        this.showScreen('start');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    showError(message) {
        this.display.error.textContent = message;
        this.display.error.classList.remove('hidden');

        setTimeout(() => {
            this.display.error.classList.add('hidden');
        }, 5000);
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    startConnectionTracking() {
        // Start tracking connection time
        this.connectionStartTime = Date.now();
        
        // Show the banner in connecting state
        if (this.display.connectionBanner) {
            this.display.connectionBanner.classList.remove('hidden', 'connected');
            this.display.connectionBanner.classList.add('connecting');
            this.display.connectionStatus.textContent = 'Connecting...';
        }
        
        // Update timer every second
        this.connectionTimerInterval = setInterval(() => {
            this.updateConnectionTimer();
        }, 1000);
    }

    updateConnectionTimer() {
        if (!this.connectionStartTime || !this.display.connectionTimer) return;
        
        const elapsed = Math.floor((Date.now() - this.connectionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        this.display.connectionTimer.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    showConnectionSuccess() {
        if (!this.display.connectionBanner) return;
        
        // Clear the timer interval
        if (this.connectionTimerInterval) {
            clearInterval(this.connectionTimerInterval);
            this.connectionTimerInterval = null;
        }
        
        // Update banner to show connected
        this.display.connectionBanner.classList.remove('connecting');
        this.display.connectionBanner.classList.add('connected');
        this.display.connectionStatus.textContent = 'Connected!';
        
        console.log('✅ Connection banner showing success');
        
        // Send connection success signal to opponent
        this.sendConnectionSuccessSignal();
        
        // Auto-hide after 5 seconds
        if (this.connectionAutoHideTimer) {
            clearTimeout(this.connectionAutoHideTimer);
        }
        
        this.connectionAutoHideTimer = setTimeout(() => {
            if (this.display.connectionBanner) {
                this.display.connectionBanner.classList.add('hidden');
            }
        }, 5000);
    }

    stopConnectionTracking() {
        if (this.connectionTimerInterval) {
            clearInterval(this.connectionTimerInterval);
            this.connectionTimerInterval = null;
        }
        
        if (this.connectionAutoHideTimer) {
            clearTimeout(this.connectionAutoHideTimer);
            this.connectionAutoHideTimer = null;
        }
        
        this.connectionStartTime = null;
    }

    sendConnectionSuccessSignal() {
        if (!this.videoRoom || !this.videoRoom.realtimeChannel) {
            console.log('⚠️ Cannot send connection signal - VideoRoom not initialized');
            return;
        }

        const signal = {
            type: 'connection-success',
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        };

        this.videoRoom.realtimeChannel.send({
            type: 'broadcast',
            event: 'peer-signal',
            payload: {
                from: this.playerId,
                type: 'connection-success',
                data: signal
            }
        });

        console.log('📢 Sent connection success signal to opponent');
    }

    setupConnectionStatusListener() {
        if (!this.videoRoom || !this.videoRoom.realtimeChannel) {
            console.log('⚠️ Cannot setup connection listener - VideoRoom not initialized');
            return;
        }

        // Listen for opponent's connection success signal
        this.videoRoom.realtimeChannel.on('broadcast', { event: 'peer-signal' }, (payload) => {
            const { from, type } = payload.payload;
            
            // Ignore own messages and non-connection signals
            if (from === this.playerId || type !== 'connection-success') return;
            
            console.log('🟢 Received connection success signal from opponent:', from);
            // Trigger connection success for the opponent
            this.showConnectionSuccess();
        });
        
        // Monitor for online scorer matches (for auto-join notification)
        this.monitorOnlineScorerMatches();
    }
    
    monitorOnlineScorerMatches() {
        if (!window.supabaseClient) {
            console.log('⚠️ Supabase not available for online scorer monitoring');
            return;
        }
        
        // Subscribe to broadcast messages from online scorer matches
        const broadcastChannel = window.supabaseClient
            .channel('video-call-global-broadcast')
            .on('broadcast', { event: 'VIDEO_CALL_PROMPT' }, (payload) => {
                console.log('📢 RECEIVED BROADCAST: Video call prompt', payload);
                
                const data = payload.payload;
                const notification = document.getElementById('autoJoinNotification');
                
                if (notification && data.roomCode) {
                    const hostName = data.hostName || 'Host';
                    const guestName = data.guestName || 'Guest';
                    
                    notification.innerHTML = `
                        <div>🎮 Online Match Connected!</div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">${hostName} vs ${guestName}</div>
                        <div style="font-size: 0.85rem; margin-top: 5px; opacity: 0.9;">Click to start video call for bull-off</div>
                    `;
                    notification.classList.add('visible');
                    
                    const autoJoinRoomCode = data.roomCode;
                    
                    notification.onclick = () => {
                        notification.classList.remove('visible');
                        const roomCodeInput = document.getElementById('roomCodeInput');
                        if (roomCodeInput) {
                            roomCodeInput.value = autoJoinRoomCode;
                        }
                        this.showScreen('join');
                    };
                    
                    console.log('✅ Video call notification shown for room:', autoJoinRoomCode);
                }
            })
            .on('broadcast', { event: 'GAME_STARTED' }, (payload) => {
                console.log('📢 RECEIVED BROADCAST: Game started', payload);
                const notification = document.getElementById('autoJoinNotification');
                if (notification) {
                    notification.classList.remove('visible');
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to video call broadcast channel');
                }
            });
        
        // Also subscribe to database changes as backup
        const channel = window.supabaseClient
            .channel('video-call-monitor')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_rooms'
                },
                (payload) => {
                    const roomData = payload.new;
                    
                    // Check if both players are connected and game hasn't started
                    if (roomData.game_state?.host_name && 
                        roomData.game_state?.guest_name && 
                        roomData.status === 'waiting') {
                        
                        console.log('📹 Online scorer match detected (DB):', roomData.room_code);
                        
                        // Show notification
                        const notification = document.getElementById('autoJoinNotification');
                        if (notification && !notification.classList.contains('visible')) {
                            const hostName = roomData.game_state.host_name;
                            const guestName = roomData.game_state.guest_name;
                            
                            notification.innerHTML = `
                                <div>🎮 Online Match Connected!</div>
                                <div style="font-size: 0.9rem; margin-top: 5px;">${hostName} vs ${guestName}</div>
                                <div style="font-size: 0.85rem; margin-top: 5px; opacity: 0.9;">Click to start video call for bull-off</div>
                            `;
                            notification.classList.add('visible');
                            
                            // Store room code for auto-join
                            const autoJoinRoomCode = roomData.room_code;
                            
                            notification.onclick = () => {
                                notification.classList.remove('visible');
                                // Populate room code input
                                const roomCodeInput = document.getElementById('roomCodeInput');
                                if (roomCodeInput) {
                                    roomCodeInput.value = autoJoinRoomCode;
                                }
                                // Switch to join screen
                                this.showScreen('join');
                            };
                        }
                    }
                    
                    // Hide notification when game starts
                    if (roomData.status === 'playing') {
                        const notification = document.getElementById('autoJoinNotification');
                        if (notification) {
                            notification.classList.remove('visible');
                        }
                    }
                }
            )
            .subscribe();
        
        console.log('👀 Monitoring online scorer matches for auto-join (broadcast + DB)');
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.playOnlineApp = new PlayOnlineV7();
});
