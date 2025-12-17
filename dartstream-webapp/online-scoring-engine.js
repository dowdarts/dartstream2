/**
 * Online Scoring Engine
 * Real-time synchronized darts scoring for multi-device play
 * 
 * Requires: Supabase authentication (via player-account.js or similar)
 * If user is not authenticated, redirects to login
 */

// Global state
let onlineState = {
    myRole: null,  // 'host' or 'guest'
    roomCode: null,
    matchId: null,
    myName: null,
    myPlayerId: null,
    opponentName: null,
    opponentPlayerId: null,
    gameType: '501',  // '501' or '301'
    startType: 'SI',  // 'SI' or 'DI'
    currentTurn: 'host',
    localInput: '',  // String for score input (e.g., '180')
    isSubscribed: false,
    supabaseChannel: null,
    authenticatedUser: null,  // Holds auth info
    isSubmitting: false,  // Prevent double submission
    takeControl: false  // Allow inputting opponent's score
};

// Authentication helper
async function checkAuthentication() {
    // DEBUG MODE: Check if we're in local testing (URL contains 'localhost' or 'file://')
    const isLocalTesting = window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || isLocalTesting;
    
    console.log('[AUTH] Auth check - Protocol:', window.location.protocol, 'Hostname:', window.location.hostname, 'IsLocalTesting:', isLocalTesting, 'DebugMode:', debugMode);
    
    if (debugMode) {
        console.log('🔧 DEBUG MODE: Skipping auth for local testing');
        onlineState.authenticatedUser = {
            id: 'debug-user-' + Math.random().toString(36).substr(2, 9),
            email: 'debug@localhost'
        };
        onlineState.myName = 'Test Player';
        return onlineState.authenticatedUser;
    }
    
    if (!window.supabaseClient) {
        console.error('Supabase client not available');
        showAuthError('Supabase not configured. Redirecting...');
        setTimeout(() => window.location.href = './player-account.html', 3000);
        return null;
    }
    
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
            console.log('✅ User authenticated:', session.user.email);
            onlineState.authenticatedUser = session.user;
            return session.user;
        } else {
            console.warn('⚠️ No active session. Redirecting to login...');
            showAuthError('Please log in to play online');
            setTimeout(() => window.location.href = './player-account.html', 3000);
            return null;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showAuthError('Authentication failed');
        return null;
    }
}

function showAuthError(message) {
    const landingScreen = document.getElementById('landing-screen');
    if (landingScreen) {
        landingScreen.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #d32f2f;">
                <h2>Authentication Required</h2>
                <p>${message}</p>
                <p>Redirecting to login...</p>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[INIT] DOMContentLoaded fired');
    const user = await checkAuthentication();
    console.log('[AUTH] checkAuthentication returned:', user ? user.email : 'null/undefined');
    if (user) {
        console.log('[INIT] Initializing player data...');
        await initializePlayerData(user);
        console.log('[INIT] Setting up event listeners...');
        setupEventListeners();
        console.log('[OK] Event listeners setup complete');
        
        // Check for reconnection to existing match
        await checkForReconnection();
    } else {
        console.error('[ERROR] Authentication failed, event listeners NOT set up');
    }
});

/**
 * Get authenticated player's name and ID
 */
async function initializePlayerData(user) {
    // If we're already in debug mode with a name set, skip DB fetch
    if (onlineState.myName === 'Test Player') {
        console.log('🔧 DEBUG MODE: Using test player data');
        return;
    }
    
    try {
        // Get player_accounts to find linked player
        const { data: accounts, error } = await window.supabaseClient
            .from('player_accounts')
            .select('account_linked_player_id, first_name, last_name')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;  // PGRST116 = no rows found
        
        if (accounts && accounts.account_linked_player_id) {
            // Get the linked player's full name
            const { data: player, error: playerError } = await window.supabaseClient
                .from('players')
                .select('id, first_name, last_name')
                .eq('id', accounts.account_linked_player_id)
                .single();
            
            if (playerError) throw playerError;
            
            onlineState.myPlayerId = player.id;
            onlineState.myName = `${player.first_name} ${player.last_name}`;
            console.log('📊 Player data loaded:', onlineState.myName, onlineState.myPlayerId);
        } else {
            // Use email as fallback
            onlineState.myName = user.email.split('@')[0];
            console.warn('⚠️ No linked player found, using email:', onlineState.myName);
        }
    } catch (error) {
        console.error('Error loading player data:', error);
        onlineState.myName = user.email.split('@')[0];
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Landing screen
    document.getElementById('host-match-btn').addEventListener('click', showHostSetup);
    document.getElementById('join-match-btn').addEventListener('click', showJoinSetup);
    
    // Setup screen
    document.getElementById('back-to-landing').addEventListener('click', showLanding);

    // Match format selection (legs)
    const matchFormatRow = document.getElementById('host-match-format-row');
    if (matchFormatRow) {
        matchFormatRow.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                matchFormatRow.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                onlineState.matchFormat = btn.getAttribute('data-format');
            });
        });
        // Default
        onlineState.matchFormat = matchFormatRow.querySelector('.option-btn.selected')?.getAttribute('data-format') || 'single';
    }

    // Set format selection
    const setFormatRow = document.getElementById('host-set-format-row');
    if (setFormatRow) {
        setFormatRow.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                setFormatRow.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                onlineState.setFormat = btn.getAttribute('data-set');
            });
        });
        // Default
        onlineState.setFormat = setFormatRow.querySelector('.option-btn.selected')?.getAttribute('data-set') || 'none';
    }

    document.getElementById('create-match-btn').addEventListener('click', hostMatch);
    document.getElementById('join-match-submit-btn').addEventListener('click', joinMatch);
    
    // Waiting screen
    document.getElementById('cancel-wait-btn').addEventListener('click', showLanding);
    
    // Game screen
    document.getElementById('back-to-landing-game').addEventListener('click', exitMatch);
    document.getElementById('action-btn').addEventListener('click', undoLastDart);
    
    // Take Control - click status bar when waiting
    document.getElementById('turn-status-bar').addEventListener('click', function() {
        const statusText = document.getElementById('status-text');
        if (statusText && statusText.textContent.includes('TAKE CONTROL')) {
            activateTakeControl();
        }
    });
    
    document.getElementById('submit-btn').addEventListener('click', function() {
        // If input is present, submit score; else, add 0 (MISS)
        if (onlineState.localInput && onlineState.localInput.length > 0) {
            submitScore();
        } else {
            addToInput(0); // MISS
        }
    });
    
    // Number pad
    document.querySelectorAll('.num-btn').forEach(btn => {
        // Dual-function 180/0 button
        if (btn.id === 'btn-180-zero') {
            btn.addEventListener('click', function() {
                if (onlineState.localInput && onlineState.localInput.length > 0) {
                    addToInput(0); // 0 when input present
                } else {
                    addToInput(180); // 180 when no input
                }
            });
        } else {
            const isEdgeButton = btn.classList.contains('edge');
            btn.addEventListener('click', (e) => {
                const score = parseInt(e.target.dataset.score);
                if (isEdgeButton) {
                    // Quick-hit: auto-submit for edge buttons
                    quickHitScore(score);
                } else {
                    addToInput(score);
                }
            });
        }
    });
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        // Only handle keyboard input when online scoring screen is active
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return;
        }
        
        // Only allow keyboard input if it's your turn
        if (onlineState.currentTurn !== onlineState.myRole) {
            return;
        }
        
        // Number keys (0-9)
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            addToInput(parseInt(e.key));
        }
        // Enter key to submit
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (onlineState.localInput && onlineState.localInput.length > 0) {
                submitScore();
            } else {
                addToInput(0); // MISS if no input
            }
        }
        // Backspace to undo last digit
        else if (e.key === 'Backspace') {
            e.preventDefault();
            undoLastDart();
        }
        // Escape to clear input
        else if (e.key === 'Escape') {
            e.preventDefault();
            onlineState.localInput = '';
            updateInputDisplay();
        }
    });
    
    // Match complete
    document.getElementById('return-to-landing-btn').addEventListener('click', showLanding);
}

/**
 * Show/Hide screens helper
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * ============ RECONNECTION LOGIC ============
 */
function saveMatchState() {
    if (!onlineState.matchId || !onlineState.roomCode) return;
    
    const matchState = {
        matchId: onlineState.matchId,
        roomCode: onlineState.roomCode,
        myRole: onlineState.myRole,
        gameType: onlineState.gameType,
        timestamp: Date.now()
    };
    
    localStorage.setItem('dartstream_active_match', JSON.stringify(matchState));
    console.log('💾 Match state saved to localStorage:', matchState);
}

function clearSavedMatchState() {
    localStorage.removeItem('dartstream_active_match');
    console.log('🗑️ Cleared saved match state');
}

async function checkForReconnection() {
    const savedMatch = localStorage.getItem('dartstream_active_match');
    if (!savedMatch) {
        console.log('ℹ️ No saved match found');
        return;
    }
    
    try {
        const matchState = JSON.parse(savedMatch);
        console.log('🔄 Found saved match:', matchState);
        
        // Check if match is still active in database
        const { data: match, error } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', matchState.matchId)
            .single();
        
        if (error || !match) {
            console.warn('⚠️ Saved match no longer exists in database');
            clearSavedMatchState();
            return;
        }
        
        // Check if match is still in progress
        if (match.status === 'complete' || match.status === 'cancelled') {
            console.log('ℹ️ Match has ended, clearing saved state');
            clearSavedMatchState();
            return;
        }
        
        // Ask user if they want to reconnect
        const shouldReconnect = confirm(`You have an active match (Room: ${matchState.roomCode}).\n\nDo you want to reconnect?`);
        
        if (!shouldReconnect) {
            console.log('❌ User declined reconnection');
            clearSavedMatchState();
            return;
        }
        
        // Restore state
        onlineState.matchId = matchState.matchId;
        onlineState.roomCode = matchState.roomCode;
        onlineState.myRole = matchState.myRole;
        onlineState.gameType = matchState.gameType;
        
        const gameState = match.game_state || {};
        if (matchState.myRole === 'host') {
            onlineState.opponentName = gameState.guest_name || 'Guest';
            onlineState.opponentPlayerId = gameState.guest_player_id;
        } else {
            onlineState.opponentName = gameState.host_name || 'Host';
            onlineState.opponentPlayerId = gameState.host_player_id;
        }
        
        console.log('✅ Reconnecting to match:', onlineState.roomCode);
        
        // Show reconnection message and go to game screen
        showScreen('game-screen');
        document.getElementById('room-code-display-game').textContent = onlineState.roomCode;
        
        // Subscribe to updates and render current state
        subscribeToMatchUpdates();
        renderGameState(match);
        
    } catch (error) {
        console.error('❌ Error during reconnection:', error);
        clearSavedMatchState();
    }
}

/**
 * ============ LANDING & SETUP SCREENS ============
 */

function showLanding() {
    resetOnlineState();
    showScreen('landing-screen');
}

function showHostSetup() {
    document.getElementById('setup-title').textContent = `Host Match - ${onlineState.myName}`;
    document.getElementById('host-setup-form').style.display = 'block';
    document.getElementById('join-setup-form').style.display = 'none';
    showScreen('setup-screen');
    
    // Remove name input if exists, since we use authenticated name
    const nameInput = document.getElementById('host-name-input');
    if (nameInput) nameInput.style.display = 'none';
    
    // Setup game type selection
    const game501 = document.getElementById('host-game-501');
    const game301 = document.getElementById('host-game-301');
    
    if (game501) {
        game501.addEventListener('click', () => {
            onlineState.gameType = '501';
            game501.classList.add('selected');
            game301.classList.remove('selected');
        });
    }
    
    if (game301) {
        game301.addEventListener('click', () => {
            onlineState.gameType = '301';
            game301.classList.add('selected');
            game501.classList.remove('selected');
        });
    }
}

function showJoinSetup() {
    document.getElementById('setup-title').textContent = 'Join Match';
    document.getElementById('host-setup-form').style.display = 'none';
    document.getElementById('join-setup-form').style.display = 'block';
    showScreen('setup-screen');
    
    // Remove guest name input if exists
    const nameInput = document.getElementById('guest-name-input');
    if (nameInput) nameInput.style.display = 'none';
    
    // Auto-format room code to uppercase
    const roomCodeInput = document.getElementById('room-code-input');
    if (roomCodeInput) {
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

/**
 * ============ HOST MATCH ============
 */
async function hostMatch() {
    // Use authenticated user name
    onlineState.myRole = 'host';
    onlineState.roomCode = generateRoomCode();
    
    showScreen('waiting-screen');
    document.getElementById('room-code-display').textContent = onlineState.roomCode;

    try {
        // Create match in Supabase using game_rooms table
        const startScore = onlineState.gameType === '501' ? 501 : 301;

        // Determine legs/sets from matchFormat and setFormat
        let totalLegs = 1, legsFormat = 'single', totalSets = 1, setsFormat = 'none';
        switch (onlineState.matchFormat) {
            case 'single': totalLegs = 1; legsFormat = 'single'; break;
            case 'playall3': totalLegs = 3; legsFormat = 'playall'; break;
            case 'bo3': totalLegs = 3; legsFormat = 'bestof'; break;
            case 'bo5': totalLegs = 5; legsFormat = 'bestof'; break;
            case 'bo7': totalLegs = 7; legsFormat = 'bestof'; break;
        }
        switch (onlineState.setFormat) {
            case 'none': totalSets = 1; setsFormat = 'none'; break;
            case 'bo3': totalSets = 3; setsFormat = 'bestof'; break;
            case 'bo5': totalSets = 5; setsFormat = 'bestof'; break;
            case 'playall': totalSets = 3; setsFormat = 'playall'; break;
        }

        const { data, error } = await window.supabaseClient
            .from('game_rooms')
            .insert([{
                room_code: onlineState.roomCode,
                host_id: onlineState.authenticatedUser.id,
                status: 'waiting',
                current_turn: 'host',
                game_state: {
                    game_type: onlineState.gameType,
                    start_type: onlineState.startType,
                    host_name: onlineState.myName,
                    host_player_id: onlineState.myPlayerId,
                    match_format: onlineState.matchFormat,
                    set_format: onlineState.setFormat,
                    total_legs: totalLegs,
                    legs_format: legsFormat,
                    total_sets: totalSets,
                    sets_format: setsFormat,
                    scores: {
                        host: startScore,
                        guest: startScore,
                        host_leg_avg: 0,
                        guest_leg_avg: 0,
                        host_match_avg: 0,
                        guest_match_avg: 0,
                        host_legs_won: 0,
                        guest_legs_won: 0,
                        host_darts_thrown: 0,
                        guest_darts_thrown: 0,
                        score_history: []
                    }
                }
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating match:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('Error keys:', Object.keys(error));
            alert(`Failed to create match: ${error?.message || JSON.stringify(error)}`);
            return;
        }

        onlineState.matchId = data.id;
        console.log('✅ Match created with room code:', onlineState.roomCode);

        // Save match state for reconnection
        saveMatchState();

        // Start listening for guest joining (subscription will trigger startGame when guest joins)
        subscribeToMatchUpdates();

    } catch (error) {
        console.error('Error in hostMatch:', error);
        alert('Error hosting match');
    }
}

/**
 * ============ JOIN MATCH ============
 */
async function joinMatch() {
    const roomCodeInput = document.getElementById('room-code-input').value.trim();
    
    if (!roomCodeInput) {
        alert('Please enter a room code');
        return;
    }
    
    // Use authenticated user name
    onlineState.myRole = 'guest';
    onlineState.roomCode = roomCodeInput;
    
    showScreen('waiting-screen');
    document.getElementById('room-code-display').textContent = onlineState.roomCode;
    document.getElementById('waiting-message').textContent = 'Joining match...';
    
    try {
        // Find the match
        const { data: match, error } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('room_code', onlineState.roomCode)
            .eq('status', 'waiting')
            .single();
        
        if (error || !match) {
            console.error('Error finding match:', error);
            console.error('Room code searched:', onlineState.roomCode);
            alert(`Room code not found: ${error?.message || 'Please check and try again'}`);
            showLanding();
            return;
        }
        
        onlineState.matchId = match.id;
        const hostGameState = match.game_state || {};
        onlineState.opponentName = hostGameState.host_name || 'Host';
        onlineState.opponentPlayerId = hostGameState.host_player_id;
        onlineState.gameType = hostGameState.game_type || '501';
        onlineState.startType = hostGameState.start_type || 'SI';
        
        // Update the match with guest info
        const { error: updateError } = await window.supabaseClient
            .from('game_rooms')
            .update({ 
                guest_id: onlineState.authenticatedUser.id,
                game_state: {
                    ...match.game_state,
                    guest_name: onlineState.myName,
                    guest_player_id: onlineState.myPlayerId
                }
            })
            .eq('id', onlineState.matchId);
        
        if (updateError) {
            console.error('Error joining match:', updateError);
            alert('Failed to join match');
            return;
        }
        
        // Save match state for reconnection
        saveMatchState();
        
        document.getElementById('waiting-message').textContent = 'Joined! Waiting for host to start...';
        subscribeToMatchUpdates();
        
    } catch (error) {
        console.error('Error in joinMatch:', error);
        alert('Error joining match');
    }
}

/**
 * ============ REAL-TIME SYNC ============
 */
function subscribeToMatchUpdates() {
    if (onlineState.isSubscribed) return;
    
    onlineState.supabaseChannel = window.supabaseClient
        .channel(`match-${onlineState.roomCode}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `room_code=eq.${onlineState.roomCode}`
            },
            (payload) => {
                const roomData = payload.new;
                
                // If both players are now present and we're NOT already on game screen, show player selection
                if (roomData.game_state?.host_name && roomData.game_state?.guest_name) {
                    // Get opponent info if we haven't yet
                    if (!onlineState.opponentName) {
                        if (onlineState.myRole === 'host') {
                            onlineState.opponentName = roomData.game_state.guest_name;
                            onlineState.opponentPlayerId = roomData.game_state.guest_player_id;
                        } else {
                            onlineState.opponentName = roomData.game_state.host_name;
                            onlineState.opponentPlayerId = roomData.game_state.host_player_id;
                        }
                    }
                    
                    // Only trigger startGame once, when on waiting screen
                    const waitingScreen = document.getElementById('waiting-screen');
                    const playerSelectionScreen = document.getElementById('player-selection-screen');
                    if (waitingScreen?.classList.contains('active')) {
                        startGame();
                    }
                    
                    // Notify parent window (split-screen mode) that both players connected
                    // Send this continuously while on player selection or waiting for game start
                    const gameScreen = document.getElementById('game-screen');
                    const isOnPreGameScreens = waitingScreen?.classList.contains('active') || 
                                              playerSelectionScreen?.classList.contains('active') ||
                                              (gameScreen?.classList.contains('active') && roomData.status === 'waiting');
                    
                    if (isOnPreGameScreens && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'ONLINE_SCORER_PLAYERS_CONNECTED',
                            roomCode: onlineState.roomCode,
                            hostName: onlineState.myRole === 'host' ? onlineState.myName : onlineState.opponentName,
                            guestName: onlineState.myRole === 'guest' ? onlineState.myName : onlineState.opponentName,
                            status: roomData.status
                        }, '*');
                        console.log('📡 Notified parent: both players connected to room', onlineState.roomCode);
                    }
                    
                    // Hide notification when game actually starts
                    if (roomData.status === 'playing' && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'ONLINE_SCORER_GAME_STARTED',
                            roomCode: onlineState.roomCode
                        }, '*');
                    }
                }
                
                // If game status changed to 'playing' and guest is on game screen waiting, render it
                if (roomData.status === 'playing' && onlineState.myRole === 'guest') {
                    const gameScreen = document.getElementById('game-screen');
                    if (gameScreen?.classList.contains('active')) {
                        console.log('🎮 Game started by host, rendering for guest');
                        renderGameState(roomData);
                    }
                }
                
                // Update the game state from database
                if (document.getElementById('game-screen').classList.contains('active')) {
                    renderGameState(roomData);
                }
            }
        )
        .subscribe();
    
    onlineState.isSubscribed = true;
}

/**
 * ============ GAME STATE RENDERING ============
 */
function renderGameState(roomData) {
    const matchData = roomData.game_state || {};
    
    // Update player names
    document.getElementById('host-name-display').textContent = matchData.host_name || 'Host';
    document.getElementById('guest-name-display').textContent = matchData.guest_name || 'Guest';
    
    const scores = matchData.scores;
    
    // Always show host as player1, guest as player2 regardless of my role
    const player1Score = scores.host;
    const player2Score = scores.guest;
    const player1Darts = scores.host_darts_thrown;
    const player2Darts = scores.guest_darts_thrown;
    
    // Calculate averages (points scored / darts thrown * 3 for 3-dart average)
    const startScore = parseInt(onlineState.gameType);
    const player1PointsScored = startScore - player1Score;
    const player2PointsScored = startScore - player2Score;
    
    const player1LegAvg = player1Darts > 0 ? (player1PointsScored / player1Darts) * 3 : 0;
    const player2LegAvg = player2Darts > 0 ? (player2PointsScored / player2Darts) * 3 : 0;
    
    // Update scoreboard
    document.getElementById('player1-score').textContent = player1Score;
    document.getElementById('player2-score').textContent = player2Score;
    document.getElementById('player1-name').textContent = matchData.host_name;
    document.getElementById('player2-name').textContent = matchData.guest_name;
    
    // Update averages (leg average only for now - match average would require persistent storage)
    document.getElementById('player1-leg-avg').textContent = player1LegAvg.toFixed(2);
    document.getElementById('player2-leg-avg').textContent = player2LegAvg.toFixed(2);
    document.getElementById('player1-match-avg').textContent = player1LegAvg.toFixed(2);
    document.getElementById('player2-match-avg').textContent = player2LegAvg.toFixed(2);
    
    // Highlight active player (score box) using .active class
    const player1Header = document.getElementById('player1-display');
    const player2Header = document.getElementById('player2-display');
    if (player1Header && player2Header) {
        if (roomData.current_turn === 'host') {
            player1Header.classList.add('active');
            player2Header.classList.remove('active');
        } else {
            player2Header.classList.add('active');
            player1Header.classList.remove('active');
        }
    }
    
    // Update leg score display
    document.getElementById('leg-score-display').textContent = 
        `${scores.host_legs_won} - ${scores.guest_legs_won}`;
    
    // Update local currentTurn state from database
    onlineState.currentTurn = roomData.current_turn;
    
    // Update turn status based on current_turn from roomData (not game_state)
    updateTurnStatus(roomData.current_turn);
    
    // Update score history with round-based display
    updatePreviousShotDisplay(scores.score_history, matchData.host_name, matchData.guest_name);
}

/**
 * ============ TURN STATUS & KEYPAD LOCK ============
 */
function updateTurnStatus(currentTurn) {
    const isMyTurn = 
        (onlineState.myRole === 'host' && currentTurn === 'host') ||
        (onlineState.myRole === 'guest' && currentTurn === 'guest');
    
    const keypad = document.getElementById('number-pad');
    const statusBar = document.getElementById('turn-status-bar');
    const statusText = document.getElementById('status-text');
    
    if (isMyTurn || onlineState.takeControl) {
        keypad.style.pointerEvents = 'auto';
        keypad.style.opacity = '1';
        statusBar.style.backgroundColor = '#28a745';
        if (onlineState.takeControl) {
            statusText.textContent = '⚠️ CONTROL MODE - Inputting for opponent';
        } else {
            statusText.textContent = '🎯 YOUR THROW';
        }
        document.getElementById('input-mode').textContent = 'Enter Score';
    } else {
        keypad.style.pointerEvents = 'none';
        keypad.style.opacity = '0.5';
        statusBar.style.backgroundColor = '#dc3545';
        statusBar.style.cursor = 'pointer';
        const opponentName = onlineState.myRole === 'host' ? 'Guest' : 'Host';
        statusText.textContent = `👆 CLICK TO TAKE CONTROL (${opponentName.toUpperCase()}\'S TURN)`;
        document.getElementById('input-mode').textContent = "Waiting...";
    }
}

/**
 * Activate Take Control mode - allow inputting opponent's score
 */
function activateTakeControl() {
    onlineState.takeControl = true;
    console.log('🔧 Take Control activated');
    updateTurnStatus(onlineState.currentTurn);
}

/**
 * Deactivate Take Control mode - return to normal turn flow
 */
function deactivateTakeControl() {
    onlineState.takeControl = false;
    console.log('✅ Take Control deactivated');
    updateTurnStatus(onlineState.currentTurn);
}

/**
 * ============ INPUT HANDLING ============
 */

/**
 * Quick-hit score for edge buttons - instantly submit without Enter
 */
function quickHitScore(score) {
    // Allow input if it's my turn OR if I have take control
    const canInput = (onlineState.currentTurn === onlineState.myRole) || onlineState.takeControl;
    if (!canInput) {
        return;
    }
    onlineState.localInput = score.toString();
    updateInputDisplay();
    setTimeout(() => submitScore(), 100);  // Brief delay for visual feedback
}

function addToInput(value) {
    // Allow input if it's my turn OR if I have take control
    const canInput = (onlineState.currentTurn === onlineState.myRole) || onlineState.takeControl;
    if (!canInput) {
        return;
    }
    if (typeof onlineState.localInput !== 'string') {
        onlineState.localInput = '';
    }
    // Max 3 digits, and max value 180
    if (onlineState.localInput.length < 3) {
        let next = onlineState.localInput + value.toString();
        let nextValue = parseInt(next, 10);
        if (!isNaN(nextValue) && nextValue >= 0 && nextValue <= 180) {
            onlineState.localInput = next;
        }
    }
    updateInputDisplay();
}

function updateInputDisplay() {
    const display = document.getElementById('input-mode');
    const submitBtn = document.getElementById('submit-btn');
    const btn180 = document.getElementById('btn-180-zero');
    if (!onlineState.localInput || onlineState.localInput.length === 0) {
        display.textContent = 'Enter Score';
        // MISS button state
        if (submitBtn) {
            submitBtn.textContent = 'MISS';
            submitBtn.classList.remove('green');
            submitBtn.classList.add('red');
        }
        // 180 button state
        if (btn180) {
            btn180.textContent = '180';
            btn180.classList.remove('operation-mode');
            btn180.classList.add('red');
        }
    } else {
        // Show the score being entered
        display.textContent = onlineState.localInput;
        // ENTER button state
        if (submitBtn) {
            submitBtn.textContent = 'ENTER';
            submitBtn.classList.remove('red');
            submitBtn.classList.add('green');
        }
        // 0 button state
        if (btn180) {
            btn180.textContent = '0';
            btn180.classList.remove('red');
            btn180.classList.add('operation-mode');
        }
    }
}

function undoLastDart() {
    if (typeof onlineState.localInput === 'string' && onlineState.localInput.length > 0) {
        onlineState.localInput = onlineState.localInput.slice(0, -1);
    }
    updateInputDisplay();
}

/**
 * ============ GOOD SHOT DISPLAY ============
 */
function showGoodShotDisplay(score) {
    const goodShotDisplay = document.getElementById('good-shot-display');
    const goodShotText = document.getElementById('good-shot-text');
    
    if (!goodShotDisplay || !goodShotText) return;
    
    let message = '';
    if (score === 180) {
        message = 'TON EIGHTY!';
    } else if (score === 171) {
        message = '171!';
    } else if (score === 140) {
        message = 'TON 40!';
    } else if (score === 100) {
        message = 'TON!';
    } else if (score >= 95 && score < 100) {
        message = `${score}!`;
    }
    
    if (message) {
        goodShotText.textContent = message;
        goodShotDisplay.style.display = 'flex';
        setTimeout(() => {
            goodShotDisplay.style.display = 'none';
        }, 2000);
    }
}

/**
 * ============ SUBMIT SCORE TO DATABASE ============
 */
async function submitScore() {
    if (!onlineState.matchId || !onlineState.localInput || onlineState.localInput.length === 0) return;
    
    // Prevent double submission
    if (onlineState.isSubmitting) {
        console.warn('⚠️ Submission already in progress');
        return;
    }
    
    const scoreInput = parseInt(onlineState.localInput, 10);
    if (isNaN(scoreInput) || scoreInput < 0 || scoreInput > 180) return;
    
    onlineState.isSubmitting = true;  // Lock submissions
    
    try {
        // Get current match state from DB
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        if (!match) return;
        const scores = match.game_state?.scores || {};
        // Determine which score to update
        const isHost = onlineState.myRole === 'host';
        const playerKey = isHost ? 'host' : 'guest';
        const opponentKey = isHost ? 'guest' : 'host';
        const preTurnScore = scores[playerKey];
        let newScore = preTurnScore - scoreInput;
        let isBust = false;
        // Bust detection: score < 0 OR score = 1 (can't finish on 1)
        if (newScore < 0 || newScore === 1) {
            isBust = true;
            newScore = preTurnScore;  // Restore original score on bust
            console.log('🎯 BUST! Score would be', newScore - preTurnScore + scoreInput, '. Restored to', preTurnScore);
        }
        // Update darts thrown (add 3 for this turn)
        const dartsKey = playerKey + '_darts_thrown';
        scores[dartsKey] = (scores[dartsKey] || 0) + 3;
        // Update the score
        scores[playerKey] = newScore;
        // Check for winner (reached exactly 0)
        let matchWinner = null;
        let legWinner = null;
        let dartOut = null;
        if (newScore === 0) {
            legWinner = playerKey;
            // Show finish darts modal and wait for response
            dartOut = await showFinishDartsModal(scoreInput);
            
            // Increment leg wins
            const legWinsKey = playerKey + '_legs_won';
            scores[legWinsKey] = (scores[legWinsKey] || 0) + 1;
            
            // Check if match is complete based on format
            const isMatchComplete = checkMatchComplete(scores, match.game_state);
            if (isMatchComplete) {
                matchWinner = playerKey;
            }
        }
        // Show good shot display for high scores
        if (!isBust && scoreInput >= 95) {
            showGoodShotDisplay(scoreInput);
        }
        
        // Add to score history
        if (!scores.score_history) scores.score_history = [];
        scores.score_history.push({
            player: playerKey,
            darts: [scoreInput],
            input: scoreInput,
            newScore: newScore,
            isBust: isBust,
            isCheckout: matchWinner ? true : false,
            dartOut: dartOut,
            timestamp: new Date().toISOString()
        });
        // Switch turn (unless match is won)
        let nextTurn = isHost ? 'guest' : 'host';
        let gameStatus = 'playing';
        if (legWinner) {
            if (matchWinner) {
                gameStatus = 'complete';
                // Show match winner modal
                showWinnerModal(playerKey, dartOut, scoreInput, true);
            } else {
                gameStatus = 'leg_complete';
                // Show leg winner modal
                showWinnerModal(playerKey, dartOut, scoreInput, false);
            }
        }
        // Update database
        const { error } = await window.supabaseClient
            .from('game_rooms')
            .update({
                game_state: {
                    ...match.game_state,
                    scores: scores,
                    match_winner: matchWinner
                },
                current_turn: nextTurn,
                status: gameStatus
            })
            .eq('id', onlineState.matchId);
        if (error) {
            console.error('Error submitting score:', error);
            return;
        }
        
        console.log(`✅ Score submitted. Turn switched from ${playerKey} to ${nextTurn}`);
        
        // Deactivate take control if it was active
        if (onlineState.takeControl) {
            deactivateTakeControl();
        }
        
        // Clear local input
        onlineState.localInput = '';
        updateInputDisplay();
        
    } catch (error) {
        console.error('Error in submitScore:', error);
    } finally {
        onlineState.isSubmitting = false;  // Always unlock
    }
}


/**
 * ============ FINISH DARTS MODAL ============
 */

/**
 * Check if match is complete based on format
 */
function checkMatchComplete(scores, gameState) {
    const hostLegs = scores.host_legs_won || 0;
    const guestLegs = scores.guest_legs_won || 0;
    const totalLegs = gameState.total_legs || 1;
    const legsFormat = gameState.legs_format || 'single';
    
    if (legsFormat === 'single') {
        // Single leg - first to 1 wins
        return hostLegs >= 1 || guestLegs >= 1;
    } else if (legsFormat === 'playall') {
        // Play all legs - match ends when all legs played
        return (hostLegs + guestLegs) >= totalLegs;
    } else if (legsFormat === 'bestof') {
        // Best of - first to majority wins
        const legsToWin = Math.ceil(totalLegs / 2);
        return hostLegs >= legsToWin || guestLegs >= legsToWin;
    }
    
    return false;
}

function showFinishDartsModal(checkoutScore) {
    return new Promise((resolve) => {
        const modal = document.getElementById('finish-darts-modal');
        if (!modal) {
            resolve(3);  // Default to 3 darts if modal not found
            return;
        }
        
        modal.style.display = 'flex';
        
        const buttons = modal.querySelectorAll('.finish-dart-btn');
        buttons.forEach(btn => {
            btn.onclick = function() {
                const darts = parseInt(btn.getAttribute('data-darts'));
                modal.style.display = 'none';
                resolve(darts);
            };
        });
    });
}

function showWinnerModal(winnerKey, dartOut, checkoutScore, isMatchComplete) {
    // Show the winner modal with info
    const modal = document.getElementById('match-complete-modal');
    if (!modal) return;
    const winnerName = winnerKey === 'host' ? (onlineState.myRole === 'host' ? onlineState.myName : onlineState.opponentName) : (onlineState.myRole === 'guest' ? onlineState.myName : onlineState.opponentName);
    document.getElementById('match-winner-name').textContent = winnerName;
    
    if (isMatchComplete) {
        document.getElementById('match-complete-text').textContent = `Match Winner! Checkout: ${checkoutScore} (Dart ${dartOut})`;
    } else {
        document.getElementById('match-complete-text').textContent = `Leg Winner! Checkout: ${checkoutScore} (Dart ${dartOut})`;
    }
    
    modal.style.display = 'flex';
    
    // Setup match complete modal buttons
    setupMatchCompleteActions(isMatchComplete);
}

/**
 * Setup match complete modal actions
 */
function setupMatchCompleteActions(isMatchComplete) {
    // Change Game Mode button
    const changeGameModeBtn = document.getElementById('change-game-mode-btn');
    if (changeGameModeBtn) {
        changeGameModeBtn.onclick = () => {
            document.getElementById('match-complete-modal').style.display = 'none';
            clearSavedMatchState();
            showLanding();
        };
    }
    
    // Continue Match button (play next leg/set)
    const continueMatchBtn = document.getElementById('continue-match-btn');
    if (continueMatchBtn) {
        if (isMatchComplete) {
            // Match is complete, disable continue button
            continueMatchBtn.disabled = true;
            continueMatchBtn.style.opacity = '0.5';
            continueMatchBtn.style.cursor = 'not-allowed';
        } else {
            // Leg complete, enable continue to next leg
            continueMatchBtn.disabled = false;
            continueMatchBtn.style.opacity = '1';
            continueMatchBtn.style.cursor = 'pointer';
            continueMatchBtn.onclick = async () => {
                await startNextLeg();
                document.getElementById('match-complete-modal').style.display = 'none';
            };
        }
    }
    
    // End Match button (save stats)
    const endMatchBtn = document.getElementById('end-match-btn');
    if (endMatchBtn) {
        endMatchBtn.onclick = async () => {
            await saveMatchStats();
            document.getElementById('match-complete-modal').style.display = 'none';
            clearSavedMatchState();
            showLanding();
        };
    }
    
    // Return to Landing button (quick exit)
    const returnBtn = document.getElementById('return-to-landing-btn');
    if (returnBtn) {
        returnBtn.onclick = () => {
            document.getElementById('match-complete-modal').style.display = 'none';
            clearSavedMatchState();
            showLanding();
        };
    }
}

/**
 * ============ MATCH COMPLETE ============
 */
function checkForMatchComplete(scores) {
    // Simple check: if either player reaches 0 or below, they win the leg
    // For now, we'll just track legs in the scores object
    // TODO: Implement full leg/match completion logic
}

/**
 * ============ UTILITY FUNCTIONS ============
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function resetOnlineState() {
    // Unsubscribe from channel
    if (onlineState.supabaseChannel) {
        onlineState.supabaseChannel.unsubscribe();
    }
    
    // Preserve auth data, reset only match data
    const auth = {
        authenticatedUser: onlineState.authenticatedUser,
        myName: onlineState.myName,
        myPlayerId: onlineState.myPlayerId
    };
    
    onlineState = {
        myRole: null,
        roomCode: null,
        matchId: null,
        opponentName: null,
        opponentPlayerId: null,
        gameType: '501',
        startType: 'SI',
        currentTurn: 'host',
        localInput: '',
        isSubscribed: false,
        supabaseChannel: null,
        ...auth
    };
}

function startGame() {
    // Only host sees player selection screen
    if (onlineState.myRole === 'host') {
        showScreen('player-selection-screen');
        
        // Display player names in selection buttons
        document.getElementById('host-name-for-selection').textContent = onlineState.myName;
        document.getElementById('guest-name-for-selection').textContent = onlineState.opponentName;
        
        // Setup player selection handlers
        const hostSelectBtn = document.getElementById('host-player-select-btn');
        const guestSelectBtn = document.getElementById('guest-player-select-btn');
        
        hostSelectBtn.onclick = () => startActualGame('host');
        guestSelectBtn.onclick = () => startActualGame('guest');
    } else {
        // Guest goes directly to waiting for host to select
        showScreen('game-screen');
        document.getElementById('room-code-display-game').textContent = onlineState.roomCode;
        document.getElementById('status-text').textContent = '⏳ HOST IS SELECTING STARTING PLAYER';
        fetchAndRenderMatchState();
    }
}

async function startActualGame(startingPlayer) {
    onlineState.currentTurn = startingPlayer;  // Set who starts locally
    
    // Update database with selected starting player
    const { error } = await window.supabaseClient
        .from('game_rooms')
        .update({
            current_turn: startingPlayer,
            status: 'playing'
        })
        .eq('id', onlineState.matchId);
    
    if (error) {
        console.error('Error updating game start:', error);
        alert('Failed to start game');
        return;
    }
    
    showScreen('game-screen');
    
    // Display room code
    document.getElementById('room-code-display-game').textContent = onlineState.roomCode;
    
    // Fetch and render initial state
    fetchAndRenderMatchState();
}

async function fetchAndRenderMatchState() {
    try {
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (match) {
            renderGameState(match);
            onlineState.currentTurn = match.current_turn;
        }
    } catch (error) {
        console.error('Error fetching match state:', error);
    }
}


function updateScoreHistory(scoreHistory) {
    // Optionally, render full score history here if needed
}

function updateScoreHistory(scoreHistory) {
    const historyContainer = document.getElementById('score-history');
    if (!historyContainer) {
        // Create score history container if it doesn't exist
        const scoringArea = document.querySelector('.scoring-area');
        if (scoringArea) {
            const newHistoryContainer = document.createElement('div');
            newHistoryContainer.id = 'score-history';
            newHistoryContainer.style.cssText = 'max-height: 200px; overflow-y: auto; margin-bottom: 8px; background: #111; border: 1px solid #333; border-radius: 4px;';
            scoringArea.insertBefore(newHistoryContainer, scoringArea.firstChild);
            return; // Exit and let the next call handle the actual rendering
        }
        return;
    }
    
    if (!Array.isArray(scoreHistory) || scoreHistory.length === 0) {
        historyContainer.innerHTML = '';
        return;
    }
    
    // Group history by rounds (visits)
    const hostHistory = scoreHistory.filter(entry => entry.player === 'host');
    const guestHistory = scoreHistory.filter(entry => entry.player === 'guest');
    const maxRounds = Math.max(hostHistory.length, guestHistory.length, 1);
    
    // Clear and rebuild
    historyContainer.innerHTML = '';
    
    for (let round = 1; round <= maxRounds; round++) {
        const entry = document.createElement('div');
        entry.className = 'score-entry';
        entry.style.cssText = 'display: flex; align-items: center; padding: 4px 8px; border-bottom: 1px solid #333;';
        
        // Player 1 (Host) column
        const p1Column = document.createElement('div');
        p1Column.className = 'player-column';
        p1Column.style.cssText = 'flex: 1; text-align: center; cursor: pointer; padding: 4px;';
        
        const hostTurn = hostHistory[round - 1];
        if (hostTurn) {
            let displayText = hostTurn.isBust ? 'X' : (hostTurn.input === 0 ? 'Ø' : hostTurn.input);
            p1Column.innerHTML = `<div class="darts">${displayText}</div>`;
            p1Column.addEventListener('click', () => editScore('host', round - 1, hostTurn));
        }
        
        // Round number with arrow
        const turnColumn = document.createElement('div');
        turnColumn.className = 'turn-info';
        turnColumn.style.cssText = 'flex: 0 0 60px; text-align: center; font-weight: bold;';
        
        // Determine if this is current round
        const isCurrentRound = round === maxRounds && (hostHistory.length !== guestHistory.length);
        const currentTurn = onlineState.currentTurn;
        
        if (isCurrentRound) {
            if (currentTurn === 'host') {
                turnColumn.innerHTML = `<span class="turn-arrow" style="color: #ffffff;">← ${round}</span>`;
            } else {
                turnColumn.innerHTML = `<span class="turn-arrow" style="color: #ffffff;">${round} →</span>`;
            }
        } else {
            turnColumn.innerHTML = `<span class="turn-number" style="color: #666666;">${round}</span>`;
        }
        
        // Player 2 (Guest) column
        const p2Column = document.createElement('div');
        p2Column.className = 'player-column';
        p2Column.style.cssText = 'flex: 1; text-align: center; cursor: pointer; padding: 4px;';
        
        const guestTurn = guestHistory[round - 1];
        if (guestTurn) {
            let displayText = guestTurn.isBust ? 'X' : (guestTurn.input === 0 ? 'Ø' : guestTurn.input);
            p2Column.innerHTML = `<div class="darts">${displayText}</div>`;
            p2Column.addEventListener('click', () => editScore('guest', round - 1, guestTurn));
        }
        
        entry.appendChild(p1Column);
        entry.appendChild(turnColumn);
        entry.appendChild(p2Column);
        historyContainer.appendChild(entry);
    }
    
    // Auto-scroll to bottom
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

/**
 * ============ MATCH CONTINUATION & STATS SAVING ============
 */

/**
 * Start next leg after current leg completion
 */
async function startNextLeg() {
    if (!onlineState.matchId) return;
    
    try {
        // Get current match state
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (!match) return;
        
        const gameState = match.game_state || {};
        const scores = gameState.scores || {};
        
        // Determine who starts next leg (alternate from current turn)
        const lastTurn = match.current_turn;
        const nextStarter = lastTurn === 'host' ? 'guest' : 'host';
        
        // Track leg counter
        if (!gameState.current_leg) gameState.current_leg = 1;
        gameState.current_leg += 1;
        
        // Reset scores to starting score
        const startScore = gameState.game_type === '501' ? 501 : 301;
        scores.host = startScore;
        scores.guest = startScore;
        scores.host_darts_thrown = 0;
        scores.guest_darts_thrown = 0;
        scores.host_leg_avg = 0;
        scores.guest_leg_avg = 0;
        scores.score_history = [];
        
        // Update database
        const { error } = await window.supabaseClient
            .from('game_rooms')
            .update({
                game_state: {
                    ...gameState,
                    scores: scores
                },
                current_turn: nextStarter,  // Alternate starter
                status: 'playing'
            })
            .eq('id', onlineState.matchId);
        
        if (error) {
            console.error('Error starting next leg:', error);
            alert('Failed to start next leg');
            return;
        }
        
        console.log(`✅ Next leg started. ${nextStarter} starts leg ${gameState.current_leg}`);
        fetchAndRenderMatchState();
        
    } catch (error) {
        console.error('Error in startNextLeg:', error);
    }
}

/**
 * Save match stats to database
 */
async function saveMatchStats() {
    if (!onlineState.matchId) return;
    
    try {
        // Get final match state
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (!match) return;
        
        const gameState = match.game_state || {};
        const scores = gameState.scores || {};
        
        // Determine winner
        const hostWon = gameState.match_winner === 'host';
        const guestWon = gameState.match_winner === 'guest';
        
        // Save host stats (if host has linked player_id)
        if (gameState.host_player_id) {
            await savePlayerMatchStats({
                player_library_id: gameState.host_player_id,
                won: hostWon,
                legs_won: scores.host_legs_won || 0,
                legs_lost: scores.guest_legs_won || 0,
                average_3dart: scores.host_match_avg || 0,
                count_180s: countAchievements(scores.score_history, 'host', 180),
                count_171s: countAchievements(scores.score_history, 'host', 171),
                count_140s: countAchievements(scores.score_history, 'host', 140),
                count_100s: countAchievements(scores.score_history, 'host', 100),
                darts_thrown: scores.host_darts_thrown || 0,
                game_type: gameState.game_type
            });
        }
        
        // Save guest stats (if guest has linked player_id)
        if (gameState.guest_player_id) {
            await savePlayerMatchStats({
                player_library_id: gameState.guest_player_id,
                won: guestWon,
                legs_won: scores.guest_legs_won || 0,
                legs_lost: scores.host_legs_won || 0,
                average_3dart: scores.guest_match_avg || 0,
                count_180s: countAchievements(scores.score_history, 'guest', 180),
                count_171s: countAchievements(scores.score_history, 'guest', 171),
                count_140s: countAchievements(scores.score_history, 'guest', 140),
                count_100s: countAchievements(scores.score_history, 'guest', 100),
                darts_thrown: scores.guest_darts_thrown || 0,
                game_type: gameState.game_type
            });
        }
        
        console.log('✅ Match stats saved');
        alert('Match stats saved successfully!');
        
    } catch (error) {
        console.error('Error saving match stats:', error);
        alert('Error saving match stats');
    }
}

/**
 * Save individual player match stats
 */
async function savePlayerMatchStats(stats) {
    try {
        const { error } = await window.supabaseClient
            .from('match_stats')
            .insert([stats]);
        
        if (error) {
            console.error('Error inserting match stats:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in savePlayerMatchStats:', error);
        throw error;
    }
}

/**
 * Count achievements from score history
 */
function countAchievements(scoreHistory, playerKey, targetScore) {
    if (!Array.isArray(scoreHistory)) return 0;
    return scoreHistory.filter(entry => 
        entry.player === playerKey && entry.input === targetScore
    ).length;
}

// Edit score functionality
async function editScore(playerKey, turnIndex, turnData) {
    // Only allow editing if you're the host
    if (onlineState.myRole !== 'host') {
        alert('Only the host can edit scores');
        return;
    }
    
    const newScore = prompt(`Edit score for ${playerKey === 'host' ? 'Player 1' : 'Player 2'} (round ${turnIndex + 1}):`, turnData.input);
    if (newScore === null) return; // Cancelled
    
    const scoreValue = parseInt(newScore, 10);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 180) {
        alert('Invalid score. Must be between 0 and 180.');
        return;
    }
    
    try {
        // Get current match state
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (!match) return;
        
        const scores = match.game_state?.scores || {};
        const scoreHistory = scores.score_history || [];
        
        // Find the turn to edit
        const playerHistory = scoreHistory.filter(entry => entry.player === playerKey);
        if (turnIndex >= playerHistory.length) {
            alert('Turn not found');
            return;
        }
        
        // Get the actual index in the full history
        let actualIndex = -1;
        let playerCount = 0;
        for (let i = 0; i < scoreHistory.length; i++) {
            if (scoreHistory[i].player === playerKey) {
                if (playerCount === turnIndex) {
                    actualIndex = i;
                    break;
                }
                playerCount++;
            }
        }
        
        if (actualIndex === -1) return;
        
        // Calculate score difference
        const oldInput = scoreHistory[actualIndex].input;
        const scoreDifference = scoreValue - oldInput;
        
        // Update the history entry
        scoreHistory[actualIndex].input = scoreValue;
        scoreHistory[actualIndex].darts = [scoreValue];
        
        // Recalculate scores from this point forward
        const startScore = onlineState.gameType === '501' ? 501 : 301;
        let hostScore = startScore;
        let guestScore = startScore;
        
        for (let i = 0; i < scoreHistory.length; i++) {
            const entry = scoreHistory[i];
            if (entry.player === 'host') {
                hostScore -= entry.input;
                entry.newScore = hostScore;
            } else {
                guestScore -= entry.input;
                entry.newScore = guestScore;
            }
        }
        
        // Update final scores in database
        scores.host = hostScore;
        scores.guest = guestScore;
        scores.score_history = scoreHistory;
        
        // Update database
        const { error } = await window.supabaseClient
            .from('game_rooms')
            .update({
                game_state: {
                    ...match.game_state,
                    scores: scores
                }
            })
            .eq('id', onlineState.matchId);
        
        if (error) {
            console.error('Error updating score:', error);
            alert('Failed to update score');
            return;
        }
        
        console.log('✅ Score edited successfully');
        
    } catch (error) {
        console.error('Error editing score:', error);
        alert('Error editing score');
    }
}

function updatePreviousShotDisplay(scoreHistory, hostName, guestName) {
    // This function is replaced by updateScoreHistory
    // Keep for compatibility but redirect to new function
    updateScoreHistory(scoreHistory);
}

function exitMatch() {
    // Clean up subscription and go back to landing
    if (onlineState.supabaseChannel) {
        onlineState.supabaseChannel.unsubscribe();
    }
    clearSavedMatchState();
    resetOnlineState();
    showLanding();
}
