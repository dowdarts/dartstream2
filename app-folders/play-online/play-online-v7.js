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
            cancelRoom: document.getElementById('cancelRoomBtn'),
            joinGame: document.getElementById('joinGameBtn'),
            backToStart: document.getElementById('backToStartBtn'),
            confirmDevices: document.getElementById('confirmDevicesBtn'),
            cancelDevices: document.getElementById('cancelDevicesBtn'),
            toggleMic: document.getElementById('toggleMicBtn'),
            toggleCamera: document.getElementById('toggleCameraBtn'),
            endCall: document.getElementById('endCallBtn'),
        };

        // Inputs
        this.inputs = {
            roomCode: document.getElementById('roomCodeInput'),
            playerName: document.getElementById('playerNameInput'),
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
        this.buttons.endCall.addEventListener('click', () => this.endCall());
    }

    async initializeModules() {
        // Wait for Supabase to load (CDN is async, may take a moment)
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.PlayerDB && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.PlayerDB) {
            this.showError('Failed to connect to database - Supabase not loaded');
            console.error('❌ PlayerDB never initialized after', maxAttempts * 100, 'ms');
            return;
        }

        // Initialize room manager
        this.roomManager = window.RoomManager;
        if (!this.roomManager) {
            this.showError('Room manager not loaded');
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
            const code = await this.roomManager.createRoom(this.playerId);
            this.roomCode = code;
            this.display.roomCode.textContent = code;

            this.showScreen('roomCode');
            this.startRoomCountdown();
        } catch (err) {
            console.error('❌ Create room failed:', err);
            this.showError('Failed to create room');
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

    async handleJoinRoom() {
        const code = this.inputs.roomCode.value.trim().toUpperCase();
        const name = this.inputs.playerName.value.trim();

        if (!code || code.length !== 4) {
            this.showError('Enter a valid 4-digit room code');
            return;
        }

        if (!name) {
            this.showError('Enter your name');
            return;
        }

        try {
            this.playerName = name;
            this.roomCode = code;

            // Join the room
            const room = await this.roomManager.joinRoom(code, this.playerId, name);

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
        this.inputs.playerName.value = '';
        this.showScreen('start');
    }

    async handleConfirmDevices() {
        if (!this.selectedDevices.camera || !this.selectedDevices.microphone) {
            this.showError('Select both camera and microphone');
            return;
        }

        try {
            // Initialize video room with selected devices
            this.videoRoom = window.VideoRoom;

            const constraints = {
                video: { deviceId: { exact: this.selectedDevices.camera } },
                audio: { deviceId: { exact: this.selectedDevices.microphone } },
            };

            // Clear preview
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }

            // Initialize video room - VideoRoom.initialize(roomCode, playerId, playerName, localVideoEl, existingStream, mediaConstraints)
            await this.videoRoom.initialize(
                this.roomCode,
                this.playerId,
                this.playerName,
                this.video.local,
                null,  // existingStream - let it create new one
                constraints
            );

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

    async endCall() {
        if (this.videoRoom) {
            await this.videoRoom.leaveRoom();
        }

        // Reset
        this.roomCode = null;
        this.playerId = this.generatePlayerId();
        this.inputs.roomCode.value = '';
        this.inputs.playerName.value = '';

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
