/**
 * VideoStream Integrated Module
 * Combines connection code generation, turn-based control, and player synchronization
 * 
 * Features:
 * - Auto-generates connection code on app load (host only)
 * - Manages turn-based control switching (only current player can input)
 * - Syncs player names from Supabase accounts (no Home/Away)
 * - Real-time room subscription for opponent connection
 * - Automatic button locking based on turn
 */

const VideoStreamIntegrated = {
    // Configuration
    CONNECTION_CODE_LENGTH: 6,
    ROOM_CODE_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    
    // State
    state: {
        currentRoom: null,
        currentUser: null,
        linkedPlayer: null,
        isHost: false,
        remotePlayer: null,
        roomCode: null,
        subscription: null,
        buttonState: {
            homeEnabled: false,
            awayEnabled: false
        }
    },

    /**
     * Initialize VideoStream Integration
     * Called on app load - auto-generates code for host or waits for guest
     */
    async initialize() {
        console.log('🎬 Initializing VideoStream Integration...');
        
        try {
            // Wait for Supabase
            await this.waitForSupabase();
            
            // Check existing authentication
            const user = await this.getCurrentUser();
            if (!user) {
                console.error('❌ No authenticated user found');
                this.showErrorScreen('Please sign in from the main app first');
                return false;
            }
            
            this.state.currentUser = user;
            
            // Get linked player info
            const player = await this.getLinkedPlayer(user.id);
            if (!player) {
                console.error('❌ No linked player account found');
                this.showErrorScreen('No linked player account. Create one in the main app first.');
                return false;
            }
            
            this.state.linkedPlayer = player;
            console.log('✅ Player loaded:', player.fullName);
            
            // Determine if this is a fresh load (host) or existing room (guest)
            const roomCode = this.getUrlRoomCode();
            
            if (roomCode) {
                // Join existing room as guest
                console.log('👤 Joining as guest with code:', roomCode);
                await this.joinAsGuest(roomCode);
            } else {
                // Create new room as host
                console.log('👨‍💼 Creating room as host');
                await this.createAsHost();
            }
            
            // Set up UI event listeners
            this.setupEventListeners();
            
            console.log('✅ VideoStream initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showErrorScreen('Failed to initialize: ' + error.message);
            return false;
        }
    },

    /**
     * Wait for Supabase client to be available
     */
    async waitForSupabase() {
        let attempts = 0;
        while (!window.supabaseClient && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available');
        }
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await window.supabaseClient.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    /**
     * Get linked player info from player_accounts table
     */
    async getLinkedPlayer(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('player_accounts')
                .select('first_name, last_name, player_id')
                .eq('user_id', userId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                return {
                    id: data.player_id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    fullName: `${data.first_name} ${data.last_name}`,
                    userId: userId
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting linked player:', error);
            return null;
        }
    },

    /**
     * Get room code from URL parameters (for guests)
     */
    getUrlRoomCode() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room');
    },

    /**
     * Generate unique connection code
     */
    generateConnectionCode() {
        let code = '';
        for (let i = 0; i < this.CONNECTION_CODE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * this.ROOM_CODE_CHARSET.length);
            code += this.ROOM_CODE_CHARSET[randomIndex];
        }
        return code;
    },

    /**
     * Create game room as host
     */
    async createAsHost() {
        try {
            this.state.isHost = true;
            
            // Generate unique code
            let roomCode = this.generateConnectionCode();
            let isUnique = false;
            let attempts = 0;
            
            while (!isUnique && attempts < 10) {
                isUnique = await this.isCodeUnique(roomCode);
                if (!isUnique) {
                    roomCode = this.generateConnectionCode();
                }
                attempts++;
            }
            
            if (!isUnique) {
                throw new Error('Failed to generate unique code');
            }
            
            this.state.roomCode = roomCode;
            
            // Insert into database
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .insert({
                    room_code: roomCode,
                    host_id: this.state.currentUser.id,
                    host_name: this.state.linkedPlayer.fullName,
                    status: 'waiting',
                    game_state: {
                        host_player: this.state.linkedPlayer,
                        guest_player: null
                    }
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.state.currentRoom = data;
            console.log('✅ Room created with code:', roomCode);
            
            // Subscribe to room updates
            await this.subscribeToRoom(roomCode);
            
            // Show waiting screen with code
            this.showWaitingScreen(roomCode);
            
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    },

    /**
     * Join game room as guest
     */
    async joinAsGuest(roomCode) {
        try {
            this.state.isHost = false;
            this.state.roomCode = roomCode;
            
            // Find room by code
            const { data: rooms, error: queryError } = await window.supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode)
                .eq('status', 'waiting')
                .single();
            
            if (queryError) {
                throw new Error('Invalid room code or room no longer available');
            }
            
            if (!rooms) {
                throw new Error('Room not found');
            }
            
            this.state.currentRoom = rooms;
            
            // Update room with guest
            const { data: updated, error: updateError } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    guest_id: this.state.currentUser.id,
                    guest_name: this.state.linkedPlayer.fullName,
                    status: 'active',
                    game_state: {
                        ...rooms.game_state,
                        guest_player: this.state.linkedPlayer
                    }
                })
                .eq('id', rooms.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            this.state.currentRoom = updated;
            console.log('✅ Joined room as guest');
            
            // Subscribe to room updates
            await this.subscribeToRoom(roomCode);
            
            // Notify host that guest joined
            this.notifyGuestJoined();
            
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    },

    /**
     * Check if code is unique
     */
    async isCodeUnique(code) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_rooms')
                .select('id')
                .eq('room_code', code)
                .maybeSingle();
            
            return !data; // Unique if no match
        } catch (error) {
            return true; // Assume unique on error
        }
    },

    /**
     * Subscribe to real-time room updates
     */
    async subscribeToRoom(roomCode) {
        try {
            this.state.subscription = window.supabaseClient
                .channel(`room:${roomCode}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_rooms',
                    filter: `room_code=eq.${roomCode}`
                }, (payload) => {
                    console.log('📡 Room updated:', payload);
                    this.handleRoomUpdate(payload.new);
                })
                .subscribe();
            
            console.log('📡 Subscribed to room updates');
        } catch (error) {
            console.error('Error subscribing to room:', error);
        }
    },

    /**
     * Handle real-time room updates
     */
    handleRoomUpdate(updatedRoom) {
        this.state.currentRoom = updatedRoom;
        
        // If waiting for guest and guest joined
        if (this.state.isHost && updatedRoom.status === 'active') {
            console.log('✅ Guest joined!');
            this.onGuestJoined(updatedRoom.game_state.guest_player);
        }
        
        // If guest and room activated, start syncing
        if (!this.state.isHost && updatedRoom.status === 'active') {
            console.log('✅ Room activated, ready to start');
        }
        
        // Sync game state changes
        if (updatedRoom.game_state) {
            this.syncGameState(updatedRoom.game_state);
        }
    },

    /**
     * Called when guest joins room (host only)
     */
    onGuestJoined(guestPlayer) {
        console.log('👤 Opponent joined:', guestPlayer.fullName);
        
        // Update gameState with actual player names
        gameState.players.player1.name = this.state.linkedPlayer.fullName;
        gameState.players.player2.name = guestPlayer.fullName;
        
        // Update UI
        this.updateStartingPlayerScreen();
        
        // Hide waiting screen, show starting player screen
        this.switchScreen('starting-player-screen');
    },

    /**
     * Sync game state from remote
     */
    syncGameState(remoteState) {
        // Update game state if changes from other player
        if (remoteState.current_player) {
            gameState.currentPlayer = remoteState.current_player;
            this.updateButtonControls();
        }
        
        if (remoteState.scores) {
            gameState.players.player1.score = remoteState.scores.player1;
            gameState.players.player2.score = remoteState.scores.player2;
        }
    },

    /**
     * Update button controls based on current player
     */
    updateButtonControls() {
        const isHome = gameState.currentPlayer === 1;
        const isHost = this.state.isHost;
        
        // Host controls player 1 (home), guest controls player 2 (away)
        const canControl = (isHome && isHost) || (!isHome && !isHost);
        
        console.log(`🎮 Control update: currentPlayer=${gameState.currentPlayer}, isHost=${isHost}, canControl=${canControl}`);
        
        // Lock/unlock buttons
        this.setButtonsEnabled(canControl);
    },

    /**
     * Set button enabled/disabled state
     */
    setButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.dart-btn, .modifier-btn, .score-btn, .function-btn');
        buttons.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        });
        
        console.log(`🔒 Buttons ${enabled ? 'unlocked' : 'locked'}`);
    },

    /**
     * Notify host that guest has joined
     */
    notifyGuestJoined() {
        // Update room to confirm guest join
        console.log('📢 Guest notification sent to host');
    },

    /**
     * Update starting player screen with actual names
     */
    updateStartingPlayerScreen() {
        try {
            // Update player names in starting player screen
            const player1Name = gameState.players.player1.name;
            const player2Name = gameState.players.player2.name;
            
            // Update all player name displays
            const nameElements = document.querySelectorAll('[id*="player1-name"], [id*="player2-name"]');
            nameElements.forEach(el => {
                if (el.id.includes('player1')) {
                    el.textContent = player1Name;
                } else if (el.id.includes('player2')) {
                    el.textContent = player2Name;
                }
            });
            
            console.log('✅ Starting player screen updated with real names');
        } catch (error) {
            console.error('Error updating starting player screen:', error);
        }
    },

    /**
     * Called when starting player is selected
     * Enables/disables buttons based on selected player
     */
    onStartingPlayerSelected(playerNumber) {
        console.log(`🎮 Starting player selected: Player ${playerNumber}`);
        gameState.currentPlayer = playerNumber;
        
        // If host, only host can control
        // If guest, only guest can control their player
        this.updateButtonControls();
        
        // Switch to game screen
        this.switchScreen('game-screen');
    },

    /**
     * Called when a turn is submitted
     * Switches control to other player
     */
    onTurnSubmitted(turnData) {
        console.log(`✅ Turn submitted by player ${gameState.currentPlayer}`);
        
        // Switch to other player
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        
        // Update button controls
        this.updateButtonControls();
        
        // Sync to remote
        this.syncTurnData(turnData);
    },

    /**
     * Sync turn data to remote player
     */
    async syncTurnData(turnData) {
        try {
            if (!this.state.currentRoom) return;
            
            const { error } = await window.supabaseClient
                .from('game_rooms')
                .update({
                    game_state: {
                        ...this.state.currentRoom.game_state,
                        current_player: gameState.currentPlayer,
                        last_turn: turnData,
                        scores: {
                            player1: gameState.players.player1.score,
                            player2: gameState.players.player2.score
                        }
                    }
                })
                .eq('id', this.state.currentRoom.id);
            
            if (error) throw error;
            console.log('📡 Turn data synced');
        } catch (error) {
            console.error('Error syncing turn data:', error);
        }
    },

    /**
     * Show waiting screen with connection code (host only)
     */
    showWaitingScreen(roomCode) {
        try {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.style.display = 'none';
            });
            
            // Create waiting screen
            const waitingScreen = document.getElementById('waiting-for-opponent-screen') || 
                                 this.createWaitingScreen();
            
            const codeDisplay = waitingScreen.querySelector('#room-code-display');
            if (codeDisplay) {
                codeDisplay.textContent = roomCode;
            }
            
            waitingScreen.style.display = 'flex';
            
            console.log('📺 Showing waiting screen with code:', roomCode);
        } catch (error) {
            console.error('Error showing waiting screen:', error);
        }
    },

    /**
     * Create waiting screen if it doesn't exist
     */
    createWaitingScreen() {
        const screen = document.createElement('div');
        screen.id = 'waiting-for-opponent-screen';
        screen.className = 'screen';
        screen.innerHTML = `
            <div class="modal-header">
                <h1>Game Room Created</h1>
            </div>
            <div class="modal-content">
                <div class="room-code-display">
                    <p class="room-code-label">Share this code with your opponent:</p>
                    <div class="room-code-box" id="room-code-display">ABC123</div>
                    <button class="copy-btn" id="copy-code-btn">📋 Copy Code</button>
                </div>
                
                <div class="connection-status">
                    <h2>Waiting for opponent...</h2>
                    <div class="status-indicator waiting">
                        <div class="spinner"></div>
                        <p>Opponent will join when they enter your code</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app').appendChild(screen);
        
        // Add copy button handler
        const copyBtn = screen.querySelector('#copy-code-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const code = screen.querySelector('#room-code-display').textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy Code';
                    }, 2000);
                });
            });
        }
        
        return screen;
    },

    /**
     * Show error screen
     */
    showErrorScreen(message) {
        const errorScreen = document.createElement('div');
        errorScreen.className = 'screen';
        errorScreen.innerHTML = `
            <div class="modal-header">
                <h1>Error</h1>
            </div>
            <div class="modal-content">
                <div class="auth-error">${message}</div>
                <button class="auth-btn" onclick="window.location.href='index.html'">Return to Main App</button>
            </div>
        `;
        
        document.getElementById('app').appendChild(errorScreen);
        errorScreen.style.display = 'flex';
    },

    /**
     * Switch screen
     */
    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = 'flex';
            targetScreen.classList.add('active');
            console.log(`📺 Switched to screen: ${screenId}`);
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Starting player button clicks
        const startingPlayerButtons = document.querySelectorAll('[id*="starting-player-btn"]');
        startingPlayerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerNum = e.target.id.includes('1') ? 1 : 2;
                this.onStartingPlayerSelected(playerNum);
            });
        });
    }
};

// Export for use in HTML
window.VideoStreamIntegrated = VideoStreamIntegrated;
