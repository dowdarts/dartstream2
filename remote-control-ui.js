/**
 * Remote Control UI Module
 * Handles screen transitions, form interactions, and UI updates for remote connection
 */

const RemoteControlUI = {
    currentScreen: 'login',
    
    /**
     * Initialize UI module
     */
    async initialize() {
        console.log('🎨 Initializing Remote Control UI...');
        
        // Wait for both modules to be ready
        await this.waitForModules();
        
        // Check if user is already logged in
        await this.checkExistingSession();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Remote Control UI initialized');
    },

    /**
     * Wait for RemoteControlModule and gameState to be available
     */
    async waitForModules() {
        let attempts = 0;
        while ((typeof RemoteControlModule === 'undefined' || typeof gameState === 'undefined') && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof RemoteControlModule === 'undefined' || typeof gameState === 'undefined') {
            console.error('Required modules not available');
            throw new Error('Modules not loaded');
        }
    },

    /**
     * Check if user has existing session
     */
    async checkExistingSession() {
        try {
            const user = await RemoteControlModule.getCurrentUser();
            if (user) {
                // User is logged in
                const player = await RemoteControlModule.getLinkedPlayer(user.id);
                if (player) {
                    this.showConnectionModeScreen(player);
                } else {
                    // No linked player account
                    this.showErrorScreen('No linked player account found. Please create one first.');
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Login screen
        const loginBtn = document.getElementById('login-btn');
        const guestBtn = document.getElementById('guest-btn');
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        if (guestBtn) {
            guestBtn.addEventListener('click', () => this.handleGuestLogin());
        }
        if (loginEmail) {
            loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        // Connection mode screen
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinRoomBtn = document.getElementById('join-room-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => this.handleCreateRoom());
        }
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => this.showJoinRoomScreen());
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Room created screen
        const copyCodeBtn = document.getElementById('copy-code-btn');
        const cancelRoomBtn = document.getElementById('cancel-room-btn');
        
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.handleCopyCode());
        }
        if (cancelRoomBtn) {
            cancelRoomBtn.addEventListener('click', () => this.handleCancelRoom());
        }

        // Join room screen
        const roomCodeInput = document.getElementById('room-code-input');
        const joinSubmitBtn = document.getElementById('join-room-btn-submit');
        const backToConnectionModeBtn = document.getElementById('back-to-connection-mode');
        
        if (roomCodeInput) {
            roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        if (joinSubmitBtn) {
            joinSubmitBtn.addEventListener('click', () => this.handleJoinRoom());
        }
        if (roomCodeInput) {
            roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleJoinRoom();
            });
        }
        if (backToConnectionModeBtn) {
            backToConnectionModeBtn.addEventListener('click', () => this.showConnectionModeScreen());
        }
    },

    /**
     * Handle login
     */
    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
        if (!email || !password) {
            this.showLoginError('Please enter email and password');
            return;
        }
        
        try {
            // Authenticate with Supabase
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                this.showLoginError(error.message);
                return;
            }
            
            if (!data.user) {
                this.showLoginError('Login failed');
                return;
            }
            
            console.log('✅ User logged in:', data.user.email);
            
            // Get linked player info
            const player = await RemoteControlModule.getLinkedPlayer(data.user.id);
            if (!player) {
                this.showLoginError('No linked player account found. Please create one first.');
                return;
            }
            
            // Clear form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            
            // Show connection mode screen
            this.showConnectionModeScreen(player);
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message);
        }
    },

    /**
     * Handle guest login (for testing)
     */
    async handleGuestLogin() {
        // For now, show error - guest mode needs setup
        alert('Guest mode coming soon. Please sign in with your account.');
    },

    /**
     * Show login error
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    },

    /**
     * Show connection mode screen
     */
    showConnectionModeScreen(playerInfo) {
        const playerName = playerInfo ? playerInfo.fullName : 'Unknown';
        
        const currentPlayerSpan = document.getElementById('current-player-name');
        if (currentPlayerSpan) {
            currentPlayerSpan.textContent = playerName;
        }
        
        this.switchScreen('connection-mode-screen');
    },

    /**
     * Handle create room
     */
    async handleCreateRoom() {
        try {
            console.log('Creating game room...');
            const result = await RemoteControlModule.createGameRoom();
            
            // Show room created screen with code
            const roomCodeDisplay = document.getElementById('room-code-display');
            if (roomCodeDisplay) {
                roomCodeDisplay.textContent = result.code;
            }
            
            // Start listening for guest connections
            this.waitForGuestConnection();
            
            this.switchScreen('room-created-screen');
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Error creating game room: ' + error.message);
        }
    },

    /**
     * Wait for guest to join
     */
    waitForGuestConnection() {
        try {
            RemoteControlModule.subscribeToRoom((roomData) => {
                console.log('📡 Room update:', roomData);
                
                if (roomData.guest_id) {
                    console.log('✅ Guest joined!');
                    this.onBothPlayersConnected(roomData);
                }
            });
        } catch (error) {
            console.error('Error setting up subscription:', error);
        }
    },

    /**
     * Handle when both players are connected
     */
    onBothPlayersConnected(roomData) {
        try {
            // Store player info in gameState for game screen
            const gameState = window.gameState || {};
            
            const hostPlayer = roomData.game_state?.host_player;
            const guestPlayer = roomData.game_state?.guest_player;
            
            if (hostPlayer && guestPlayer) {
                gameState.players = gameState.players || {};
                gameState.players.player1 = {
                    ...gameState.players.player1,
                    name: hostPlayer.fullName,
                    linkedPlayerId: hostPlayer.playerId
                };
                gameState.players.player2 = {
                    ...gameState.players.player2,
                    name: guestPlayer.fullName,
                    linkedPlayerId: guestPlayer.playerId
                };
                
                // Update starting player screen with actual player names
                document.getElementById('starting-player1-name-top').textContent = hostPlayer.fullName;
                document.getElementById('starting-player2-name-top').textContent = guestPlayer.fullName;
                document.getElementById('start-player1').textContent = hostPlayer.fullName;
                document.getElementById('start-player2').textContent = guestPlayer.fullName;
                
                // Switch to starting player screen
                this.switchScreen('starting-player-screen');
            }
        } catch (error) {
            console.error('Error handling both players connected:', error);
        }
    },

    /**
     * Show join room screen
     */
    showJoinRoomScreen() {
        const joinPlayerName = document.getElementById('join-player-name');
        const playerInfo = RemoteControlModule.getLinkedPlayerInfo();
        
        if (joinPlayerName && playerInfo) {
            joinPlayerName.textContent = playerInfo.fullName;
        }
        
        // Clear input
        document.getElementById('room-code-input').value = '';
        document.getElementById('join-error').style.display = 'none';
        
        this.switchScreen('join-room-screen');
    },

    /**
     * Handle join room
     */
    async handleJoinRoom() {
        const code = document.getElementById('room-code-input').value.toUpperCase().trim();
        const joinErrorDiv = document.getElementById('join-error');
        
        if (!code || code.length !== 6) {
            this.showJoinError('Please enter a valid 6-character code');
            return;
        }
        
        try {
            console.log('Joining room with code:', code);
            const result = await RemoteControlModule.joinGameRoom(code);
            
            console.log('✅ Joined room:', result);
            
            // Update game state with player info
            const gameState = window.gameState || {};
            gameState.players = gameState.players || {};
            gameState.players.player1 = {
                ...gameState.players.player1,
                name: result.hostPlayer.fullName,
                linkedPlayerId: result.hostPlayer.playerId
            };
            gameState.players.player2 = {
                ...gameState.players.player2,
                name: result.guestPlayer.fullName,
                linkedPlayerId: result.guestPlayer.playerId
            };
            
            // Update starting player screen
            document.getElementById('starting-player1-name-top').textContent = result.hostPlayer.fullName;
            document.getElementById('starting-player2-name-top').textContent = result.guestPlayer.fullName;
            document.getElementById('start-player1').textContent = result.hostPlayer.fullName;
            document.getElementById('start-player2').textContent = result.guestPlayer.fullName;
            
            // Subscribe to room updates
            RemoteControlModule.subscribeToRoom((roomData) => {
                console.log('📡 Room update:', roomData);
            });
            
            // Switch to starting player screen
            this.switchScreen('starting-player-screen');
        } catch (error) {
            console.error('Error joining room:', error);
            this.showJoinError(error.message);
        }
    },

    /**
     * Show join error
     */
    showJoinError(message) {
        const errorDiv = document.getElementById('join-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    },

    /**
     * Handle copy code to clipboard
     */
    async handleCopyCode() {
        const code = document.getElementById('room-code-display').textContent;
        try {
            await navigator.clipboard.writeText(code);
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying code:', error);
        }
    },

    /**
     * Handle cancel room
     */
    async handleCancelRoom() {
        try {
            await RemoteControlModule.leaveRoom();
            this.showConnectionModeScreen(RemoteControlModule.getLinkedPlayerInfo());
        } catch (error) {
            console.error('Error canceling room:', error);
        }
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await RemoteControlModule.leaveRoom();
            await window.supabaseClient.auth.signOut();
            
            // Clear login form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('login-error').style.display = 'none';
            
            this.switchScreen('login-screen');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    },

    /**
     * Switch to a different screen
     */
    switchScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            console.log(`📺 Switched to screen: ${screenId}`);
        }
    }
};

// Initialize when modules are ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize RemoteControlModule first
    try {
        await RemoteControlModule.initialize();
        // Then initialize UI
        await RemoteControlUI.initialize();
    } catch (error) {
        console.error('Error initializing modules:', error);
        alert('Error initializing app. Please refresh the page.');
    }
});
