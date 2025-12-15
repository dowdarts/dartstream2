// VideoStreamscoringapp.js - Multiplayer Online Scoring with Video Integration
// Adapts online-scoring-app.js logic to VideoStreamscoringapp.html design + WebRTC video calling

const VideoStreamScoringApp = {
    // Game configuration
    roomCode: null,
    isHost: false,
    localPlayerNumber: 1, // 1 for Home, 2 for Away
    supabaseClient: null,
    realtimeChannel: null,
    
    // WebRTC video configuration
    rtcConfig: {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
        ]
    },
    localStream: null,
    peerConnection: null,
    localPlayerId: null,
    
    gameState: {
        currentInput: '',
        turnTotal: 0,
        currentPlayer: 1, // 1 = Home, 2 = Away
        currentVisit: [],
        visitNumber: 1,
        
        players: {
            player1: { // Home
                name: 'Home',
                userId: null,
                score: 501,
                legWins: 0,
                setWins: 0,
                matchDarts: 0,
                matchScore: 0,
                matchAvg: 0,
                legAvg: 0,
                turnHistory: [],
                achievements: {
                    count_180s: 0,
                    count_171s: 0,
                    count_95s: 0,
                    count_100_plus: 0,
                    count_120_plus: 0,
                    count_140_plus: 0,
                    count_160_plus: 0
                }
            },
            player2: { // Away
                name: 'Away',
                userId: null,
                score: 501,
                legWins: 0,
                setWins: 0,
                matchDarts: 0,
                matchScore: 0,
                matchAvg: 0,
                legAvg: 0,
                turnHistory: [],
                achievements: {
                    count_180s: 0,
                    count_171s: 0,
                    count_95s: 0,
                    count_100_plus: 0,
                    count_120_plus: 0,
                    count_140_plus: 0,
                    count_160_plus: 0
                }
            }
        },
        
        matchSettings: {
            gameType: 501,
            startScore: 501,
            format: 'leg', // 'leg' or 'set'
            legsPerSet: 3,
            setsToWin: 2,
            doubleOut: true
        },
        
        allLegs: []
    },

    // Initialize the app
    async initialize(config) {
        console.log('🎮 Initializing VideoStreamscoringapp with config:', config);
        
        // Set up Supabase
        this.supabaseClient = window.supabase.createClient(
            'https://kswwbqumgsdissnwuiab.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnV1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mzk1OTExMjgsImV4cCI6MTk1NTE2NzEyOH0.rH2m0cUi5Bi8lUGNahIZ7b9M2vJrF4rMVlYH7VN4dzY'
        );
        
        // Extract config
        this.roomCode = config.roomCode || null;
        this.isHost = config.isHost || false;
        this.localPlayerNumber = config.localPlayerNumber || 1;
        
        // Update player names from config
        if (config.player1Name) this.gameState.players.player1.name = config.player1Name;
        if (config.player2Name) this.gameState.players.player2.name = config.player2Name;
        
        // Update match settings
        Object.assign(this.gameState.matchSettings, config.matchSettings || {});
        this.gameState.players.player1.score = this.gameState.matchSettings.startScore;
        this.gameState.players.player2.score = this.gameState.matchSettings.startScore;
        
        // Show starting player selection screen
        this.showStartingPlayerSelection();
        
        // Set up Realtime sync if multiplayer
        if (this.roomCode) {
            this.setupRealtimeChannel();
            // Initialize video call
            setTimeout(() => this.initializeVideo(), 500);
        }
        
        // Update display
        this.updateDisplay();
    },

    // Show starting player selection screen
    showStartingPlayerSelection() {
        console.log('📍 Showing starting player selection');
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('starting-player-screen').style.display = 'block';
        
        // Update player names in header
        document.getElementById('starting-player1-name-top').textContent = this.gameState.players.player1.name;
        document.getElementById('starting-player2-name-top').textContent = this.gameState.players.player2.name;
        
        // Update button text to match player names
        document.getElementById('start-player1').textContent = this.gameState.players.player1.name;
        document.getElementById('start-player2').textContent = this.gameState.players.player2.name;
        
        // Set button event listeners
        document.getElementById('start-player1').onclick = () => this.selectStartingPlayer(1);
        document.getElementById('start-player2').onclick = () => this.selectStartingPlayer(2);
        document.getElementById('coin-toss-btn').onclick = () => this.coinToss();
        document.getElementById('random-btn').onclick = () => this.selectStartingPlayer(Math.random() > 0.5 ? 1 : 2);
        document.getElementById('skip-btn').onclick = () => this.selectStartingPlayer(1);
    },

    // Select starting player
    selectStartingPlayer(playerNum) {
        console.log('🎯 Starting player selected:', playerNum);
        this.currentPlayer = playerNum;
        
        // Broadcast to other player if multiplayer
        if (this.roomCode && this.realtimeChannel) {
            this.realtimeChannel.send({
                type: 'broadcast',
                event: 'starting-player-selected',
                payload: { startingPlayer: playerNum }
            });
        }
        
        // Hide coin toss, show game screen
        document.getElementById('coin-result-display').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        document.getElementById('starting-player-screen').style.display = 'none';
        
        this.updateDisplay();
    },

    // Coin toss
    coinToss() {
        const result = Math.random() > 0.5 ? 1 : 2;
        const resultText = result === 1 ? this.gameState.players.player1.name : this.gameState.players.player2.name;
        document.getElementById('coin-result-text').textContent = `${resultText} Wins the Toss!`;
        document.getElementById('coin-result-display').style.display = 'flex';
        setTimeout(() => this.selectStartingPlayer(result), 2000);
    },

    // Setup Realtime channel for multiplayer sync
    setupRealtimeChannel() {
        console.log('🌐 Setting up Realtime channel:', `online-scoring:${this.roomCode}`);
        
        this.realtimeChannel = this.supabaseClient.channel(`online-scoring:${this.roomCode}`);
        
        this.realtimeChannel.on('broadcast', { event: 'score-input' }, (payload) => {
            console.log('📊 Score input received:', payload.payload);
            // Update from other player's input
        });
        
        this.realtimeChannel.on('broadcast', { event: 'turn-complete' }, (payload) => {
            console.log('✅ Turn complete received:', payload.payload);
            // Update game state from other player's turn
        });
        
        this.realtimeChannel.on('broadcast', { event: 'game-state' }, (payload) => {
            console.log('🔄 Game state sync:', payload.payload);
            // Sync complete game state
        });
        
        this.realtimeChannel.subscribe((status) => {
            console.log('Channel status:', status);
        });
    },

    // Handle number button clicks
    handleNumberButtonClick(score) {
        if (this.gameState.currentInput.length < 3) {
            this.gameState.currentInput += score.toString();
            this.updateDisplay();
        }
    },

    // Submit current input
    submitCurrentInput() {
        const input = this.gameState.currentInput.trim();
        if (!input) return;
        
        const score = parseInt(input);
        if (isNaN(score) || score < 0 || score > 180) {
            alert('Invalid score');
            return;
        }
        
        this.addScore(score);
    },

    // Add score and complete turn
    addScore(score) {
        const currentPlayer = this.gameState.players[`player${this.gameState.currentPlayer}`];
        const otherPlayer = this.gameState.players[`player${3 - this.gameState.currentPlayer}`];
        
        // Update score
        currentPlayer.score -= score;
        currentPlayer.matchDarts += 3;
        currentPlayer.matchScore += score;
        
        // Check for bust
        if (currentPlayer.score < 0 || (currentPlayer.score === 1)) {
            currentPlayer.score += score; // Restore
            score = 0; // Bust = 0
        } else if (currentPlayer.score === 0 && !this.gameState.matchSettings.doubleOut) {
            // Win condition (non-double-out)
            this.handleWin(this.gameState.currentPlayer);
            return;
        }
        
        // Record turn
        currentPlayer.turnHistory.push({
            total: score,
            darts: this.gameState.currentVisit,
            bust: score === 0
        });
        
        // Update achievements
        if (score === 180) currentPlayer.achievements.count_180s++;
        if (score === 171) currentPlayer.achievements.count_171s++;
        if (score === 95) currentPlayer.achievements.count_95s++;
        if (score >= 100) currentPlayer.achievements.count_100_plus++;
        if (score >= 120) currentPlayer.achievements.count_120_plus++;
        if (score >= 140) currentPlayer.achievements.count_140_plus++;
        if (score >= 160) currentPlayer.achievements.count_160_plus++;
        
        // Calculate averages
        const legsWithTurns = currentPlayer.turnHistory.filter(t => t).length;
        currentPlayer.legAvg = legsWithTurns > 0 ? (currentPlayer.matchScore / legsWithTurns / 3).toFixed(2) : 0;
        currentPlayer.matchAvg = currentPlayer.matchDarts > 0 ? (currentPlayer.matchScore / currentPlayer.matchDarts * 3).toFixed(2) : 0;
        
        // Broadcast turn to other player
        if (this.roomCode && this.realtimeChannel) {
            this.realtimeChannel.send({
                type: 'broadcast',
                event: 'turn-complete',
                payload: {
                    playerNum: this.gameState.currentPlayer,
                    score: score,
                    gameState: this.gameState
                }
            });
        }
        
        // Switch player
        this.gameState.currentPlayer = 3 - this.gameState.currentPlayer;
        this.gameState.currentInput = '';
        this.gameState.currentVisit = [];
        
        this.updateDisplay();
    },

    // Handle leg win
    handleWin(winnerNum) {
        const winner = this.gameState.players[`player${winnerNum}`];
        const loser = this.gameState.players[`player${3 - winnerNum}`];
        
        winner.legWins++;
        
        // Check for set win
        if (winner.legWins >= this.gameState.matchSettings.legsPerSet) {
            this.handleSetWin(winnerNum);
        } else {
            this.startNewLeg();
        }
    },

    // Handle set win
    handleSetWin(winnerNum) {
        const winner = this.gameState.players[`player${winnerNum}`];
        winner.setWins++;
        
        // Check for match win
        if (winner.setWins >= this.gameState.matchSettings.setsToWin) {
            this.showMatchComplete(winnerNum);
        } else {
            this.startNewSet();
        }
    },

    // Show match complete screen
    showMatchComplete(winnerNum) {
        const winner = this.gameState.players[`player${winnerNum}`];
        const loser = this.gameState.players[`player${3 - winnerNum}`];
        
        document.getElementById('match-winner-name').textContent = winner.name;
        document.getElementById('match-complete-text').textContent = `${winner.name} wins ${winner.setWins}-${loser.setWins}!`;
        
        document.getElementById('match-complete-modal').style.display = 'flex';
        
        // Return to main menu button
        document.getElementById('discard-match-btn').onclick = () => {
            document.getElementById('match-complete-modal').style.display = 'none';
            window.location.href = 'index.html';
        };
    },

    // Start new leg
    startNewLeg() {
        this.gameState.players.player1.score = this.gameState.matchSettings.startScore;
        this.gameState.players.player2.score = this.gameState.matchSettings.startScore;
        this.gameState.players.player1.turnHistory = [];
        this.gameState.players.player2.turnHistory = [];
        this.gameState.currentInput = '';
        this.gameState.currentVisit = [];
        this.gameState.visitNumber = 1;
        
        this.updateDisplay();
    },

    // Start new set
    startNewSet() {
        this.gameState.players.player1.legWins = 0;
        this.gameState.players.player2.legWins = 0;
        this.startNewLeg();
    },

    // Update display
    updateDisplay() {
        const p1 = this.gameState.players.player1;
        const p2 = this.gameState.players.player2;
        
        // Update scores
        document.getElementById('player1-display').querySelector('.score-large').textContent = p1.score;
        document.getElementById('player2-display').querySelector('.score-large').textContent = p2.score;
        
        // Update player names
        document.getElementById('player1-display').querySelector('.player-name-large').textContent = p1.name;
        document.getElementById('player2-display').querySelector('.player-name-large').textContent = p2.name;
        
        // Update averages
        document.getElementById('player1-leg-avg').textContent = p1.legAvg;
        document.getElementById('player1-match-avg').textContent = p1.matchAvg;
        document.getElementById('player2-leg-avg').textContent = p2.legAvg;
        document.getElementById('player2-match-avg').textContent = p2.matchAvg;
        
        // Update input display
        document.getElementById('input-mode').textContent = this.gameState.currentInput || '---';
        
        // Highlight current player
        document.getElementById('player1-display').classList.toggle('active', this.gameState.currentPlayer === 1);
        document.getElementById('player2-display').classList.toggle('active', this.gameState.currentPlayer === 2);
        
        // Update set/leg scores
        const setScoreElem = document.getElementById('set-score-display');
        const legScoreElem = document.getElementById('leg-score-display');
        if (setScoreElem) setScoreElem.textContent = `${p1.setWins} - ${p2.setWins}`;
        if (legScoreElem) legScoreElem.textContent = `${p1.legWins} - ${p2.legWins}`;
    },

    // ========== WebRTC VIDEO METHODS ==========
    
    // Initialize video call
    async initializeVideo() {
        try {
            console.log('📹 Initializing video...');
            
            // Get user ID from Supabase auth
            const { data: { user } } = await this.supabaseClient.auth.getUser();
            if (user) {
                this.localPlayerId = user.id;
            }
            
            // Request media devices
            const constraints = {
                video: true,
                audio: true
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Local stream acquired');
            
            // Display local video
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
            
            // Initialize WebRTC peer connection
            await this.setupPeerConnection();
            
        } catch (error) {
            console.error('❌ Error initializing video:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    },

    // Setup WebRTC peer connection
    async setupPeerConnection() {
        try {
            console.log('🔌 Setting up peer connection...');
            
            this.peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle incoming remote tracks
            this.peerConnection.ontrack = (event) => {
                console.log('📹 Received remote track:', event.track.kind);
                const remoteVideo = document.getElementById('remote-video');
                if (remoteVideo && !remoteVideo.srcObject) {
                    remoteVideo.srcObject = event.streams[0];
                    console.log('✅ Remote video displayed');
                }
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 ICE candidate:', event.candidate);
                    this.sendSignal('ice-candidate', event.candidate);
                }
            };
            
            // Monitor connection state
            this.peerConnection.onconnectionstatechange = () => {
                console.log('🔗 Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    console.log('✅ Peer connected!');
                }
            };
            
            // If host, create and send offer
            if (this.isHost) {
                console.log('🎬 Host: Creating offer...');
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);
                this.sendSignal('offer', offer);
                console.log('✅ Offer sent');
            }
            
            // Listen for signaling messages
            this.listenForSignals();
            
        } catch (error) {
            console.error('❌ Error setting up peer connection:', error);
        }
    },

    // Send signaling message via Supabase Realtime
    async sendSignal(type, data) {
        if (!this.realtimeChannel) {
            console.warn('⚠️ Realtime channel not ready');
            return;
        }
        
        try {
            await this.realtimeChannel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { type, data, from: this.localPlayerId }
            });
        } catch (error) {
            console.error('❌ Error sending signal:', error);
        }
    },

    // Listen for signaling messages
    listenForSignals() {
        if (!this.realtimeChannel) return;
        
        this.realtimeChannel.on('broadcast', { event: 'signal' }, async (payload) => {
            const { type, data, from } = payload.payload;
            
            // Ignore own messages
            if (from === this.localPlayerId) return;
            
            console.log('📡 Received signal:', type);
            
            try {
                switch (type) {
                    case 'offer':
                        console.log('📨 Received offer, creating answer...');
                        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                        const answer = await this.peerConnection.createAnswer();
                        await this.peerConnection.setLocalDescription(answer);
                        this.sendSignal('answer', answer);
                        console.log('✅ Answer sent');
                        break;
                        
                    case 'answer':
                        console.log('📨 Received answer');
                        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                        console.log('✅ Answer processed');
                        break;
                        
                    case 'ice-candidate':
                        console.log('🧊 Adding ICE candidate');
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                        console.log('✅ ICE candidate added');
                        break;
                }
            } catch (error) {
                console.error('❌ Error processing signal:', error);
            }
        });
    },

    // Toggle audio mute
    toggleAudio() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            console.log('🎤 Audio:', audioTrack.enabled ? 'ON' : 'OFF');
        }
    },

    // Toggle video
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            console.log('📹 Video:', videoTrack.enabled ? 'ON' : 'OFF');
        }
    },

    // Hang up video call
    hangupVideo() {
        try {
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }
            
            const localVideo = document.getElementById('local-video');
            const remoteVideo = document.getElementById('remote-video');
            if (localVideo) localVideo.srcObject = null;
            if (remoteVideo) remoteVideo.srcObject = null;
            
            console.log('📴 Video call ended');
        } catch (error) {
            console.error('❌ Error hanging up:', error);
        }
    }
};

// Wait for Supabase to load
function waitForSupabase() {
    if (window.supabase) {
        console.log('✅ Supabase loaded');
        return Promise.resolve();
    }
    return new Promise(resolve => {
        const check = setInterval(() => {
            if (window.supabase) {
                console.log('✅ Supabase loaded');
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
}

// Initialize when DOM is ready
waitForSupabase().then(() => {
    window.VideoStreamScoringApp = VideoStreamScoringApp;
});

console.log('📦 VideoStreamscoringapp.js loaded');
