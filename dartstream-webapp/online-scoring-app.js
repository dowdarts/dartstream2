// ===== ONLINE SCORING APP =====
// Synchronized scoring for online multiplayer matches
// Connects two players via Supabase Realtime, locks controls based on turn

const OnlineScoringApp = {
    gameState: null,
    roomCode: null,
    isHost: false,
    localPlayerNumber: null, // 1 or 2
    supabaseClient: null,
    realtimeChannel: null,
    
    // Initialize the app
    async initialize(config) {
        console.log('🎯 Initializing Online Scoring App...', config);
        
        // Store configuration
        this.roomCode = config.roomCode;
        this.isHost = config.isHost;
        this.localPlayerNumber = config.localPlayerNumber; // 1 for host, 2 for guest
        
        // Wait for Supabase
        await this.waitForSupabase();
        
        // Initialize game state
        this.gameState = {
            currentPlayer: config.firstThrow === 'player1' ? 1 : 2,
            currentVisit: [],
            currentInput: '',
            dartsThrown: 0,
            turnTotal: 0,
            visitNumber: 1,
            currentSet: 1,
            currentLeg: 1,
            players: {
                player1: {
                    name: config.player1Name || 'Player 1',
                    playerId: config.player1Id,
                    score: config.startScore,
                    preTurnScore: config.startScore,
                    darts: 0,
                    legDarts: 0,
                    matchDarts: 0,
                    legScore: 0,
                    matchScore: 0,
                    legWins: 0,
                    setWins: 0,
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
                player2: {
                    name: config.player2Name || 'Player 2',
                    playerId: config.player2Id,
                    score: config.startScore,
                    preTurnScore: config.startScore,
                    darts: 0,
                    legDarts: 0,
                    matchDarts: 0,
                    legScore: 0,
                    matchScore: 0,
                    legWins: 0,
                    setWins: 0,
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
            matchSettings: { ...config },
            allLegs: []
        };
        
        // Show room code banner
        document.getElementById('room-code-banner').style.display = 'block';
        document.getElementById('room-code-display').textContent = this.roomCode;
        
        // Setup Realtime connection
        this.setupRealtimeChannel();
        
        // Attach event handlers
        this.attachEventHandlers();
        
        // Update display
        this.updateDisplay();
        
        // Check turn control
        this.updateTurnControl();
        
        console.log('✅ Online Scoring App initialized');
    },
    
    // Wait for Supabase client to be available
    async waitForSupabase() {
        let attempts = 0;
        while ((!window.supabase || !window.supabase.createClient) && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.supabase && window.supabase.createClient) {
            const SUPABASE_URL = 'https://kswwbqumgsdissnwuiab.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnd1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODMwNTIsImV4cCI6MjA4MDA1OTA1Mn0.b-z8JqL1dBYJcrrzSt7u6VAaFAtTOl1vqqtFFgHkJ50';
            this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client ready');
        } else {
            console.error('❌ Failed to initialize Supabase');
        }
    },
    
    // Setup Realtime channel for score synchronization
    setupRealtimeChannel() {
        console.log(`📡 Setting up Realtime channel for room: ${this.roomCode}`);
        
        // Create channel with ALL listeners BEFORE subscribe
        this.realtimeChannel = this.supabaseClient
            .channel(`online-scoring:${this.roomCode}`)
            .on('broadcast', { event: 'score-input' }, (payload) => {
                console.log('📥 Received score-input:', payload.payload);
                this.handleRemoteScoreInput(payload.payload);
            })
            .on('broadcast', { event: 'turn-complete' }, (payload) => {
                console.log('📥 Received turn-complete:', payload.payload);
                this.handleRemoteTurnComplete(payload.payload);
            })
            .on('broadcast', { event: 'game-state' }, (payload) => {
                console.log('📥 Received game-state:', payload.payload);
                this.syncGameState(payload.payload);
            })
            .subscribe((status) => {
                console.log(`📡 Channel status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime channel connected');
                    
                    // Broadcast initial game state if host
                    if (this.isHost) {
                        this.broadcastGameState();
                    }
                }
            });
    },
    
    // Attach event handlers for scoring controls
    attachEventHandlers() {
        // Number buttons
        const numButtons = document.querySelectorAll('.num-btn[data-score]');
        numButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isMyTurn()) {
                    this.handleNumberButtonClick(e);
                }
            });
        });
        
        // Action buttons
        document.getElementById('action-btn')?.addEventListener('click', () => {
            if (this.isMyTurn()) {
                this.handleUndo();
            }
        });
        
        document.getElementById('submit-btn')?.addEventListener('click', () => {
            if (this.isMyTurn()) {
                this.submitCurrentInput();
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.isMyTurn()) {
                this.handleKeydown(e);
            }
        });
    },
    
    // Check if it's the local player's turn
    isMyTurn() {
        return this.gameState.currentPlayer === this.localPlayerNumber;
    },
    
    // Update turn control (lock/unlock UI)
    updateTurnControl() {
        const overlay = document.getElementById('turn-lock-overlay');
        const opponentStatus = document.getElementById('opponent-status');
        
        if (this.isMyTurn()) {
            // My turn - hide overlay, enable controls
            overlay.style.display = 'none';
            document.getElementById('number-pad').style.opacity = '1';
            document.getElementById('number-pad').style.pointerEvents = 'all';
        } else {
            // Opponent's turn - show overlay, disable controls
            overlay.style.display = 'flex';
            document.getElementById('number-pad').style.opacity = '0.5';
            document.getElementById('number-pad').style.pointerEvents = 'none';
            
            const opponentName = this.gameState.currentPlayer === 1 ? 
                this.gameState.players.player1.name : 
                this.gameState.players.player2.name;
            opponentStatus.textContent = `${opponentName} is throwing...`;
        }
    },
    
    // Handle number button click
    handleNumberButtonClick(event) {
        const score = parseInt(event.currentTarget.getAttribute('data-score'));
        this.addDartScore(score);
        
        // Broadcast to opponent
        this.broadcastScoreInput(score);
    },
    
    // Add a dart score
    addDartScore(score) {
        if (this.gameState.dartsThrown >= 3) return;
        
        this.gameState.currentVisit.push(score);
        this.gameState.dartsThrown++;
        this.gameState.turnTotal += score;
        
        this.updateDisplay();
        
        // Auto-complete turn after 3 darts
        if (this.gameState.dartsThrown === 3) {
            setTimeout(() => this.completeTurn(), 500);
        }
    },
    
    // Complete the current turn
    completeTurn() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        
        // Calculate new score
        const newScore = player.score - this.gameState.turnTotal;
        
        // Check for bust (score goes below 0, equals 1, or invalid finish)
        const isBust = newScore < 0 || newScore === 1 || 
            (this.gameState.matchSettings.doubleOut && newScore === 0 && !this.isDoubleOut());
        
        if (isBust) {
            // Bust - restore score
            player.score = player.preTurnScore;
            this.showBustMessage();
        } else {
            // Valid turn
            player.score = newScore;
            player.darts += this.gameState.dartsThrown;
            player.legDarts += this.gameState.dartsThrown;
            player.matchDarts += this.gameState.dartsThrown;
            player.legScore += this.gameState.turnTotal;
            player.matchScore += this.gameState.turnTotal;
            
            // Update averages
            player.legAvg = player.legDarts > 0 ? (player.legScore / player.legDarts * 3).toFixed(2) : 0;
            player.matchAvg = player.matchDarts > 0 ? (player.matchScore / player.matchDarts * 3).toFixed(2) : 0;
            
            // Track achievements
            this.trackAchievements(this.gameState.turnTotal, player);
            
            // Check for win
            if (player.score === 0) {
                this.handleLegWin();
                return;
            }
        }
        
        // Store pre-turn score for next turn
        player.preTurnScore = player.score;
        
        // Switch turns
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        this.gameState.currentInput = '';
        
        // Broadcast turn completion
        this.broadcastTurnComplete();
        
        // Update display and turn control
        this.updateDisplay();
        this.updateTurnControl();
    },
    
    // Handle undo
    handleUndo() {
        if (this.gameState.dartsThrown === 0) return;
        
        const removedScore = this.gameState.currentVisit.pop();
        this.gameState.dartsThrown--;
        this.gameState.turnTotal -= removedScore;
        
        this.updateDisplay();
        
        // Broadcast undo to opponent
        this.broadcastScoreInput(-1); // -1 signals undo
    },
    
    // Submit current input (MISS button)
    submitCurrentInput() {
        this.addDartScore(0);
        this.broadcastScoreInput(0);
    },
    
    // Update the display
    updateDisplay() {
        // Update player scores
        document.getElementById('player1-name').textContent = this.gameState.players.player1.name;
        document.getElementById('player1-score').textContent = this.gameState.players.player1.score;
        document.getElementById('player1-avg').textContent = `AVG: ${this.gameState.players.player1.matchAvg}`;
        
        document.getElementById('player2-name').textContent = this.gameState.players.player2.name;
        document.getElementById('player2-score').textContent = this.gameState.players.player2.score;
        document.getElementById('player2-avg').textContent = `AVG: ${this.gameState.players.player2.matchAvg}`;
        
        // Update dart display
        for (let i = 0; i < 3; i++) {
            const dartSlot = document.getElementById(`dart${i + 1}`);
            dartSlot.textContent = this.gameState.currentVisit[i] !== undefined ? 
                this.gameState.currentVisit[i] : '-';
        }
        
        // Update turn total
        document.getElementById('turn-total').textContent = this.gameState.turnTotal;
        
        // Highlight current player
        document.getElementById('player1-score-area').style.backgroundColor = 
            this.gameState.currentPlayer === 1 ? 'rgba(59, 130, 246, 0.3)' : '';
        document.getElementById('player2-score-area').style.backgroundColor = 
            this.gameState.currentPlayer === 2 ? 'rgba(239, 68, 68, 0.3)' : '';
    },
    
    // Track achievements
    trackAchievements(turnTotal, player) {
        if (turnTotal === 180) player.achievements.count_180s++;
        if (turnTotal === 171) player.achievements.count_171s++;
        if (turnTotal >= 100) player.achievements.count_100_plus++;
        if (turnTotal >= 120) player.achievements.count_120_plus++;
        if (turnTotal >= 140) player.achievements.count_140_plus++;
        if (turnTotal >= 160) player.achievements.count_160_plus++;
    },
    
    // Broadcast score input to opponent
    broadcastScoreInput(score) {
        if (!this.realtimeChannel) return;
        
        this.realtimeChannel.send({
            type: 'broadcast',
            event: 'score-input',
            payload: {
                score: score,
                from: this.localPlayerNumber,
                dartsThrown: this.gameState.dartsThrown,
                turnTotal: this.gameState.turnTotal
            }
        });
    },
    
    // Broadcast turn completion
    broadcastTurnComplete() {
        if (!this.realtimeChannel) return;
        
        this.realtimeChannel.send({
            type: 'broadcast',
            event: 'turn-complete',
            payload: {
                from: this.localPlayerNumber,
                newPlayer: this.gameState.currentPlayer
            }
        });
    },
    
    // Broadcast full game state
    broadcastGameState() {
        if (!this.realtimeChannel) return;
        
        this.realtimeChannel.send({
            type: 'broadcast',
            event: 'game-state',
            payload: {
                gameState: this.gameState,
                from: this.localPlayerNumber
            }
        });
    },
    
    // Handle remote score input
    handleRemoteScoreInput(payload) {
        if (payload.from === this.localPlayerNumber) return; // Ignore own broadcasts
        
        if (payload.score === -1) {
            // Undo
            if (this.gameState.dartsThrown > 0) {
                const removedScore = this.gameState.currentVisit.pop();
                this.gameState.dartsThrown--;
                this.gameState.turnTotal -= removedScore;
            }
        } else {
            // Add score
            this.gameState.currentVisit.push(payload.score);
            this.gameState.dartsThrown = payload.dartsThrown;
            this.gameState.turnTotal = payload.turnTotal;
        }
        
        this.updateDisplay();
    },
    
    // Handle remote turn completion
    handleRemoteTurnComplete(payload) {
        if (payload.from === this.localPlayerNumber) return;
        
        this.gameState.currentPlayer = payload.newPlayer;
        this.updateTurnControl();
    },
    
    // Sync full game state
    syncGameState(payload) {
        if (payload.from === this.localPlayerNumber) return;
        
        this.gameState = payload.gameState;
        this.updateDisplay();
        this.updateTurnControl();
    },
    
    // Handle keyboard input
    handleKeydown(e) {
        // Numbers 0-9
        if (e.key >= '0' && e.key <= '9') {
            this.gameState.currentInput += e.key;
        }
        // Backspace
        else if (e.key === 'Backspace') {
            this.gameState.currentInput = this.gameState.currentInput.slice(0, -1);
        }
        // Enter
        else if (e.key === 'Enter' && this.gameState.currentInput) {
            const score = parseInt(this.gameState.currentInput);
            if (score >= 0 && score <= 180) {
                this.addDartScore(score);
                this.broadcastScoreInput(score);
            }
            this.gameState.currentInput = '';
        }
    },
    
    // Check if last dart was a double out
    isDoubleOut() {
        // Simplified - would need actual dart tracking for proper validation
        return this.gameState.turnTotal >= 2 && this.gameState.turnTotal <= 40 && this.gameState.turnTotal % 2 === 0;
    },
    
    // Show bust message
    showBustMessage() {
        const opponentStatus = document.getElementById('opponent-status');
        opponentStatus.textContent = 'BUST!';
        opponentStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
        setTimeout(() => {
            opponentStatus.style.backgroundColor = '';
        }, 2000);
    },
    
    // Handle leg win
    handleLegWin() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        this.gameState.players[currentPlayerKey].legWins++;
        
        alert(`${this.gameState.players[currentPlayerKey].name} wins the leg!`);
        
        // Check if match is over
        const legsNeeded = Math.ceil(this.gameState.matchSettings.totalLegs / 2);
        if (this.gameState.players[currentPlayerKey].legWins >= legsNeeded) {
            this.handleMatchWin();
        } else {
            this.startNewLeg();
        }
    },
    
    // Start new leg
    startNewLeg() {
        const startScore = this.gameState.matchSettings.startScore;
        
        this.gameState.players.player1.score = startScore;
        this.gameState.players.player1.preTurnScore = startScore;
        this.gameState.players.player1.legDarts = 0;
        this.gameState.players.player1.legScore = 0;
        this.gameState.players.player1.legAvg = 0;
        
        this.gameState.players.player2.score = startScore;
        this.gameState.players.player2.preTurnScore = startScore;
        this.gameState.players.player2.legDarts = 0;
        this.gameState.players.player2.legScore = 0;
        this.gameState.players.player2.legAvg = 0;
        
        this.gameState.currentLeg++;
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        
        this.updateDisplay();
        this.broadcastGameState();
    },
    
    // Handle match win
    handleMatchWin() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        alert(`🏆 ${this.gameState.players[currentPlayerKey].name} wins the match!`);
        
        // Save match stats (TODO: implement)
        // Return to menu or rematch
    }
};

// Initialize when URL parameters are set
window.addEventListener('load', () => {
    console.log('🎯 Online Scoring App page loaded');
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) debugStatus.textContent = 'Page loaded - waiting for parent message...';
    
    // Listen for initialization from parent window
    window.addEventListener('message', (event) => {
        console.log('📨 Received message:', event.data);
        
        if (event.data.type === 'initialize-online-game') {
            console.log('✅ Received initialization config:', event.data.config);
            if (debugStatus) debugStatus.textContent = 'Config received - initializing...';
            
            // Hide loading screen, show app
            const loadingScreen = document.getElementById('loading-screen');
            const app = document.getElementById('app');
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (app) {
                app.style.display = 'block';
                app.style.height = '100vh';
                app.style.width = '100%';
            }
            
            // Show room code banner
            const roomBanner = document.getElementById('room-code-banner');
            if (roomBanner) roomBanner.style.display = 'block';
            
            OnlineScoringApp.initialize(event.data.config);
        }
    });
    
    // Debug: Send ready signal to parent
    setTimeout(() => {
        console.log('📤 Sending ready signal to parent');
        window.parent.postMessage({ type: 'iframe-ready' }, '*');
    }, 500);
});
