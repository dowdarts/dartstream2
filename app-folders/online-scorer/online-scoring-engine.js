/**
 * Online Scoring Engine
 * Real-time synchronized darts scoring for multi-device play
 */

// Global state
let onlineState = {
    myRole: null,  // 'host' or 'guest'
    roomCode: null,
    matchId: null,
    myName: null,
    opponentName: null,
    gameType: '501',  // '501' or '301'
    startType: 'SI',  // 'SI' or 'DI'
    currentTurn: 'host',
    localInput: 0,  // Current dart input being built
    isSubscribed: false,
    supabaseChannel: null
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

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
    document.getElementById('setup-title').textContent = 'Host Match';
    document.getElementById('host-setup-form').style.display = 'block';
    document.getElementById('join-setup-form').style.display = 'none';
    showScreen('setup-screen');
    
    // Setup game type selection
    document.getElementById('host-game-501').addEventListener('click', () => {
        onlineState.gameType = '501';
        document.getElementById('host-game-501').classList.add('selected');
        document.getElementById('host-game-301').classList.remove('selected');
    });
    document.getElementById('host-game-301').addEventListener('click', () => {
        onlineState.gameType = '301';
        document.getElementById('host-game-301').classList.add('selected');
        document.getElementById('host-game-501').classList.remove('selected');
    });
}

function showJoinSetup() {
    document.getElementById('setup-title').textContent = 'Join Match';
    document.getElementById('host-setup-form').style.display = 'none';
    document.getElementById('join-setup-form').style.display = 'block';
    showScreen('setup-screen');
    
    // Auto-format room code to uppercase
    document.getElementById('room-code-input').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

/**
 * ============ HOST MATCH ============
 */
async function hostMatch() {
    const nameInput = document.getElementById('host-name-input').value.trim();
    onlineState.myName = nameInput || 'Home';
    onlineState.myRole = 'host';
    
    // Generate random room code
    onlineState.roomCode = generateRoomCode();
    
    showScreen('waiting-screen');
    document.getElementById('room-code-display').textContent = onlineState.roomCode;
    
    try {
        // Create match in Supabase
        const startScore = onlineState.gameType === '501' ? 501 : 301;
        
        const { data, error } = await window.supabase
            .from('live_matches')
            .insert([{
                room_code: onlineState.roomCode,
                host_name: onlineState.myName,
                game_type: onlineState.gameType,
                start_type: onlineState.startType,
                current_turn: 'host',
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
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating match:', error);
            alert('Failed to create match. Please try again.');
            return;
        }
        
        onlineState.matchId = data.id;
        
        // Start listening for guest joining
        subscribeToMatchUpdates();
        
        // Wait for guest to join (poll every 1 second)
        const waitForGuest = setInterval(async () => {
            const { data: match } = await window.supabase
                .from('live_matches')
                .select('*')
                .eq('room_code', onlineState.roomCode)
                .single();
            
            if (match && match.guest_name) {
                clearInterval(waitForGuest);
                onlineState.opponentName = match.guest_name;
                startGame();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error in hostMatch:', error);
        alert('Error hosting match');
    }
}

/**
 * ============ JOIN MATCH ============
 */
async function joinMatch() {
    const nameInput = document.getElementById('guest-name-input').value.trim();
    const roomCodeInput = document.getElementById('room-code-input').value.trim();
    
    if (!roomCodeInput) {
        alert('Please enter a room code');
        return;
    }
    
    // Get role from URL parameter (set by lobby) or default to guest
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role') || 'guest';
    
    onlineState.myName = nameInput || 'Away';
    onlineState.myRole = urlRole;
    console.log('🎯 joinMatch() setting role to:', urlRole);
            .from('live_matches')
            .select('*')
            .eq('room_code', onlineState.roomCode)
            .eq('is_active', true)
            .single();
        
        if (error || !match) {
            alert('Room code not found. Please check and try again.');
            showLanding();
            return;
        }
        
        onlineState.matchId = match.id;
        onlineState.opponentName = match.host_name;
        onlineState.gameType = match.game_type;
        onlineState.startType = match.start_type;
        
        // Update the match with guest name
        const { error: updateError } = await window.supabase
            .from('live_matches')
            .update({ guest_name: onlineState.myName })
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
    
    onlineState.supabaseChannel = window.supabase
        .channel(`match-${onlineState.roomCode}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_matches',
                filter: `room_code=eq.${onlineState.roomCode}`
            },
            (payload) => {
                const matchData = payload.new;
                
                // If both players are now present and we're still on waiting screen, start game
                if (matchData.host_name && matchData.guest_name && document.getElementById('waiting-screen').classList.contains('active')) {
                    startGame();
                }
                
                // Update the game state from database
                if (document.getElementById('game-screen').classList.contains('active')) {
                    renderGameState(matchData);
                }
            }
        )
        .subscribe();
    
    onlineState.isSubscribed = true;
}

/**
 * ============ GAME STATE RENDERING ============
 */
function renderGameState(matchData) {
    // Update player names
    document.getElementById('host-name-display').textContent = matchData.host_name;
    document.getElementById('guest-name-display').textContent = matchData.guest_name;
    
    const scores = matchData.scores;
    
    // Determine which player is which on our screen
    const isHost = onlineState.myRole === 'host';
    const player1Score = isHost ? scores.host : scores.guest;
    const player2Score = isHost ? scores.guest : scores.host;
    const player1Darts = isHost ? scores.host_darts_thrown : scores.guest_darts_thrown;
    const player2Darts = isHost ? scores.guest_darts_thrown : scores.host_darts_thrown;
    
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
    
    // Update leg score display
    document.getElementById('leg-score-display').textContent = 
        `${scores.host_legs_won} - ${scores.guest_legs_won}`;
    
    // Update turn status and keypad lock
    updateTurnStatus(matchData.current_turn);
    
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
    
    // Build the dart value (up to 2-3 darts per turn = 9 total limit)
    if (onlineState.localInput.toString().length < 3) {
        onlineState.localInput = onlineState.localInput * 100 + value;
        updateInputDisplay();
    }
}

function updateInputDisplay() {
    const display = document.getElementById('input-mode');
    if (onlineState.localInput === 0) {
        display.textContent = 'Enter Score';
    } else {
        // Show the darts being entered
        const dartStr = onlineState.localInput.toString();
        let formatted = '';
        for (let i = 0; i < dartStr.length; i += 2) {
            if (i > 0) formatted += ' ';
            formatted += dartStr.substr(i, 2);
        }
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
    if (!onlineState.matchId) return;
    
    try {
        // Get current match state from DB
        const { data: match } = await window.supabase
            .from('live_matches')
            .select('*')
            .eq('id', onlineState.matchId)
            .single();
        
        if (!match) return;
        
        const scores = match.scores;
        const scoreInput = onlineState.localInput || 0;
        
        // Determine which score to update
        const isHost = onlineState.myRole === 'host';
        const playerKey = isHost ? 'host' : 'guest';
        const opponentKey = isHost ? 'guest' : 'host';
        
        let newScore = scores[playerKey] - scoreInput;
        
        // Bust detection
        if (newScore < 0 || newScore === 1) {
            newScore = scores[playerKey];  // Restore original score
        }
        
        // Update darts thrown
        const dartsKey = playerKey + '_darts_thrown';
        scores[dartsKey] = (scores[dartsKey] || 0) + 3;
        
        // Update the score
        scores[playerKey] = newScore;
        
        // Add to score history
        if (!scores.score_history) scores.score_history = [];
        scores.score_history.push({
            player: playerKey,
            input: scoreInput,
            newScore: newScore,
            timestamp: new Date().toISOString()
        });
        
        // Switch turn
        const nextTurn = isHost ? 'guest' : 'host';
        
        // Update database
        const { error } = await window.supabase
            .from('live_matches')
            .update({
                scores: scores,
                current_turn: nextTurn,
                updated_by: playerKey
            })
            .eq('id', onlineState.matchId);
        
        if (error) {
            console.error('Error submitting score:', error);
            return;
        }
        
        // Clear local input
        onlineState.localInput = 0;
        updateInputDisplay();
        
        // The database subscription will trigger renderGameState
        
    } catch (error) {
        console.error('Error in submitScore:', error);
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
    
    onlineState = {
        myRole: null,
        roomCode: null,
        matchId: null,
        myName: null,
        opponentName: null,
        gameType: '501',
        startType: 'SI',
        currentTurn: 'host',
        localInput: 0,
        isSubscribed: false,
        supabaseChannel: null
    };
}

function startGame() {
    onlineState.currentTurn = 'host';  // Host always starts
    showScreen('game-screen');
    
    // Display room code
    document.getElementById('room-code-display-game').textContent = onlineState.roomCode;
    
    // Fetch and render initial state
    fetchAndRenderMatchState();
}

async function fetchAndRenderMatchState() {
    try {
        const { data: match } = await window.supabase
            .from('live_matches')
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

// Make supabase client globally available
window.supabase = window.supabaseClient || supabase;
