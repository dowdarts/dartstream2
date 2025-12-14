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

            // Get preview stream
            const constraints = {
                video: { deviceId: { exact: this.selectedDevices.camera } },
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
        }
        this.roomCode = null;
        this.showScreen('start');
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
            // If we're in settings mode, update devices and reconnect to video call
            if (this.isSettingsMode) {
                // Stop old stream
                if (this.mediaStream) {
                    this.mediaStream.getTracks().forEach(track => track.stop());
                }

                const constraints = {
                    video: { deviceId: { exact: this.selectedDevices.camera } },
                    audio: { deviceId: { exact: this.selectedDevices.microphone } },
                };

                // Disconnect from current video room
                if (this.videoRoom) {
                    await this.videoRoom.leaveRoom();
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
                    console.log('✅ Peer joined:', peerId, peerName);
                    this.display.opponentName.textContent = peerName || 'Opponent';
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

                // Reset media states
                this.micEnabled = true;
                this.cameraEnabled = true;
                this.buttons.toggleMic.textContent = '🎤';
                this.buttons.toggleCamera.textContent = '📷';

                this.isSettingsMode = false;
                this.showScreen('videoCall');
                this.showError('Settings updated and reconnected!');
                console.log('✅ Settings updated and video call reconnected');
                return;
            }

            // Normal flow: Initialize video room with selected devices
            const constraints = {
                video: { deviceId: { exact: this.selectedDevices.camera } },
                audio: { deviceId: { exact: this.selectedDevices.microphone } },
            };

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

            // Show video call screen
            this.showScreen('videoCall');
            this.display.youName.textContent = this.playerName || 'You';

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

            // Clear peers for fresh connection
            this.videoRoom.peers = {};

            // Reconnect to same room
            await this.videoRoom.initialize(
                this.roomCode,
                this.playerId,
                this.playerName,
                this.video.local,
                null,  // Get fresh stream
                {
                    video: { deviceId: { exact: this.selectedDevices.camera } },
                    audio: { deviceId: { exact: this.selectedDevices.microphone } },
                }
            );

            this.mediaStream = this.videoRoom.localStream;

            // Reset media states
            this.micEnabled = true;
            this.cameraEnabled = true;
            this.buttons.toggleMic.textContent = '🎤';
            this.buttons.toggleCamera.textContent = '📷';

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
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.playOnlineApp = new PlayOnlineV7();
});
