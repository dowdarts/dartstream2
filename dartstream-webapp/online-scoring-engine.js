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
    localInput: [],  // Array of dart values (1-25)
    isSubscribed: false,
    supabaseChannel: null,
    authenticatedUser: null  // Holds auth info
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
    document.getElementById('create-match-btn').addEventListener('click', hostMatch);
    document.getElementById('join-match-submit-btn').addEventListener('click', joinMatch);
    
    // Waiting screen
    document.getElementById('cancel-wait-btn').addEventListener('click', showLanding);
    
    // Game screen
    document.getElementById('back-to-landing-game').addEventListener('click', exitMatch);
    document.getElementById('action-btn').addEventListener('click', undoLastDart);
    document.getElementById('submit-btn').addEventListener('click', submitScore);
    
    // Number pad
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => addToInput(parseInt(e.target.dataset.score)));
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
    
    // Determine which player is which on our screen
    const isHost = onlineState.myRole === 'host';
    const player1Score = isHost ? scores.host : scores.guest;
    const player2Score = isHost ? scores.guest : scores.host;
    const player1Darts = isHost ? scores.host_darts_thrown : scores.guest_darts_thrown;
    const player2Darts = isHost ? scores.guest_darts_thrown : scores.host_darts_thrown;
    
    // Update scoreboard
    document.getElementById('player1-score').textContent = player1Score;
    document.getElementById('player2-score').textContent = player2Score;
    document.getElementById('player1-name').textContent = matchData.host_name;
    document.getElementById('player2-name').textContent = matchData.guest_name;
    
    // Highlight active player (white background on their score)
    const player1Display = document.querySelector('[id="player1-score"]')?.parentElement;
    const player2Display = document.querySelector('[id="player2-score"]')?.parentElement;
    
    if (roomData.current_turn === 'host') {
        player1Display?.style.setProperty('background-color', 'rgba(255, 255, 255, 0.15)', 'important');
        player2Display?.style.setProperty('background-color', 'transparent');
    } else {
        player1Display?.style.setProperty('background-color', 'transparent');
        player2Display?.style.setProperty('background-color', 'rgba(255, 255, 255, 0.15)', 'important');
    }
    
    // Update leg score display
    document.getElementById('leg-score-display').textContent = 
        `${scores.host_legs_won} - ${scores.guest_legs_won}`;
    
    // Update turn status based on current_turn from roomData (not game_state)
    updateTurnStatus(roomData.current_turn);
    
    // Update score history if it exists
    if (scores.score_history && scores.score_history.length > 0) {
        updateScoreHistory(scores.score_history);
    }
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
    
    if (isMyTurn) {
        keypad.style.pointerEvents = 'auto';
        keypad.style.opacity = '1';
        statusBar.style.backgroundColor = '#28a745';
        statusText.textContent = '🎯 YOUR THROW';
        document.getElementById('input-mode').textContent = 'Enter Score';
    } else {
        keypad.style.pointerEvents = 'none';
        keypad.style.opacity = '0.5';
        statusBar.style.backgroundColor = '#dc3545';
        const opponentName = onlineState.myRole === 'host' ? 'Guest' : 'Host';
        statusText.textContent = `⏳ ${opponentName.toUpperCase()}'S TURN`;
        document.getElementById('input-mode').textContent = "Waiting...";
    }
}

/**
 * ============ INPUT HANDLING ============
 */
function addToInput(value) {
    // Only allow input if it's your turn
    if (onlineState.currentTurn !== onlineState.myRole) {
        return;
    }
    
    // Store as array of darts instead of concatenated number
    // Each dart value can be 1-20, 25 (bull), 50 (outer bull)
    if (!Array.isArray(onlineState.localInput)) {
        onlineState.localInput = [];
    }
    
    // Max 3 darts per turn
    if (onlineState.localInput.length < 3) {
        // If current entry is incomplete (0-9), combine with next digit
        // Otherwise start new dart
        const lastDart = onlineState.localInput[onlineState.localInput.length - 1];
        
        if (lastDart !== undefined && lastDart < 20) {
            // Combine: 2 + 5 = 25, or 1 + 0 = 10
            const combined = lastDart * 10 + value;
            if (combined <= 25) {  // Valid dart is 1-20, 25
                onlineState.localInput[onlineState.localInput.length - 1] = combined;
            }
        } else {
            // Start new dart
            onlineState.localInput.push(value);
        }
        updateInputDisplay();
    }
}

function updateInputDisplay() {
    const display = document.getElementById('input-mode');
    if (!Array.isArray(onlineState.localInput) || onlineState.localInput.length === 0) {
        display.textContent = 'Enter Score';
    } else {
        // Show the darts being entered with proper formatting
        const formatted = onlineState.localInput.join(' ');
        display.textContent = formatted;
    }
}

function undoLastDart() {
    onlineState.localInput = Math.floor(onlineState.localInput / 100);
    updateInputDisplay();
}

/**
 * ============ SUBMIT SCORE TO DATABASE ============
 */
async function submitScore() {
    if (!onlineState.matchId || !Array.isArray(onlineState.localInput) || onlineState.localInput.length === 0) return;
    
    try {
        // Get current match state from DB
        const { data: match } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (!match) return;
        
        const scores = match.game_state?.scores || {};
        
        // Calculate total from dart array
        const scoreInput = onlineState.localInput.reduce((sum, dart) => sum + dart, 0);
        
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
        if (newScore === 0) {
            matchWinner = playerKey;
        }
        
        // Add to score history
        if (!scores.score_history) scores.score_history = [];
        scores.score_history.push({
            player: playerKey,
            darts: onlineState.localInput,
            input: scoreInput,
            newScore: newScore,
            isBust: isBust,
            timestamp: new Date().toISOString()
        });
        
        // Switch turn (unless match is won)
        let nextTurn = isHost ? 'guest' : 'host';
        let gameStatus = 'playing';
        
        if (matchWinner) {
            gameStatus = 'complete';
            // Prompt for dartout (will handle separately)
            promptForDartOut(playerKey);
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
        
        // Clear local input
        onlineState.localInput = [];
        updateInputDisplay();
        
    } catch (error) {
        console.error('Error in submitScore:', error);
    }
}

function promptForDartOut(winnerKey) {
    // TODO: Show dialog asking which dart was used for checkout (double, single, outer bull)
    // This will affect average calculation
    const message = `Player ${winnerKey === 'host' ? onlineState.myName : onlineState.opponentName} won! What dart was used?\n\n1: Single\n2: Double\n3: Outer Bull`;
    const choice = prompt(message);
    // TODO: Update scores with dart out type
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
        localInput: 0,
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
    const historyEl = document.getElementById('score-history');
    // TODO: Implement score history rendering
}

function exitMatch() {
    // Clean up subscription and go back to landing
    if (onlineState.supabaseChannel) {
        onlineState.supabaseChannel.unsubscribe();
    }
    resetOnlineState();
    showLanding();
}
