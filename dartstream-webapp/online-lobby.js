/**
 * Online Lobby System
 * Allows players to browse public matches and instantly join
 * Integrates with both online scorer and video call (split-screen mode)
 */

let lobbyState = {
    currentUser: null,
    myDisplayName: null,
    myUserId: null,
    availableMatches: [],
    myHostedMatch: null,
    matchTimer: null,
    matchExpiryTime: null,
    realtimeChannel: null,
    matchSetup: {
        gameType: '501',
        startScore: 501,
        doubleIn: false,
        doubleOut: true,
        matchFormat: 'single',
        totalLegs: 1
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[LOBBY] Initializing...');
    
    // Check authentication
    const user = await checkAuthentication();
    if (!user) {
        console.error('[LOBBY] Authentication failed');
        return;
    }
    
    lobbyState.currentUser = user;
    lobbyState.myUserId = user.id;
    
    // Get player name
    await loadPlayerName(user);
    
    // Setup UI listeners
    setupUIListeners();
    
    // Load available matches
    await loadAvailableMatches();
    
    // Subscribe to real-time updates
    subscribeToLobbyUpdates();
    
    // Subscribe to join requests (if user is hosting)
    subscribeToJoinRequests();
    
    console.log('[LOBBY] ✅ Initialization complete');
});

/**
 * Check authentication (similar to online-scoring-engine)
 */
async function checkAuthentication() {
    const isLocalTesting = window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || isLocalTesting;
    
    if (debugMode) {
        console.log('🔧 DEBUG MODE: Skipping auth');
        return {
            id: 'debug-user-' + Math.random().toString(36).substr(2, 9),
            email: 'debug@localhost'
        };
    }
    
    if (!window.supabaseClient) {
        alert('Supabase not configured');
        return null;
    }
    
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
            console.log('✅ Authenticated:', session.user.email);
            return session.user;
        } else {
            alert('Please log in first');
            window.location.href = './player-account.html';
            return null;
        }
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

/**
 * Load player's display name from database
 */
async function loadPlayerName(user) {
    try {
        const { data: accounts, error } = await window.supabaseClient
            .from('player_accounts')
            .select('account_linked_player_id, first_name, last_name')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (accounts && accounts.account_linked_player_id) {
            const { data: player } = await window.supabaseClient
                .from('players')
                .select('first_name, last_name')
                .eq('id', accounts.account_linked_player_id)
                .single();
            
            if (player) {
                lobbyState.myDisplayName = `${player.first_name} ${player.last_name}`;
            }
        }
        
        // Fallback to email
        if (!lobbyState.myDisplayName) {
            lobbyState.myDisplayName = user.email.split('@')[0];
        }
        
        console.log('[LOBBY] Display name:', lobbyState.myDisplayName);
    } catch (error) {
        console.error('Error loading player name:', error);
        lobbyState.myDisplayName = user.email.split('@')[0];
    }
}

/**
 * Setup UI event listeners
 */
function setupUIListeners() {
    document.getElementById('host-lobby-match-btn').addEventListener('click', showMatchSetupModal);
    document.getElementById('back-to-scorer-btn').addEventListener('click', () => {
        window.location.href = './webapp-online-scorer.html';
    });
    
    // Match setup modal buttons
    document.getElementById('create-match-submit-btn').addEventListener('click', createLobbyMatch);
    document.getElementById('cancel-setup-btn').addEventListener('click', hideMatchSetupModal);
    
    // NOTE: Direct join mode - no join request modal needed anymore
}

/**
 * Show match setup modal
 */
function showMatchSetupModal() {
    document.getElementById('match-setup-modal').classList.add('active');
    // Reset to defaults
    selectGameType('501');
    selectFormat('single', 1);
}

/**
 * Hide match setup modal
 */
function hideMatchSetupModal() {
    document.getElementById('match-setup-modal').classList.remove('active');
}

/**
 * Select game type
 */
window.selectGameType = function(type) {
    lobbyState.matchSetup.gameType = type;
    
    if (type === '501') {
        lobbyState.matchSetup.startScore = 501;
        lobbyState.matchSetup.doubleIn = false;
        lobbyState.matchSetup.doubleOut = true;
    } else if (type === '301') {
        lobbyState.matchSetup.startScore = 301;
        lobbyState.matchSetup.doubleIn = true;
        lobbyState.matchSetup.doubleOut = true;
    }
    
    // Update button styles
    document.getElementById('game-501').style.background = type === '501' ? '#4CAF50' : '#666';
    document.getElementById('game-301').style.background = type === '301' ? '#4CAF50' : '#666';
};

/**
 * Select match format
 */
window.selectFormat = function(format, legs) {
    lobbyState.matchSetup.matchFormat = format;
    lobbyState.matchSetup.totalLegs = legs;
    
    // Update button styles
    ['single', 'bo3', 'bo5', 'bo7'].forEach(f => {
        const btn = document.getElementById(`format-${f}`);
        if (btn) {
            btn.style.background = f === format ? '#4CAF50' : '#666';
        }
    });
};

/**
 * Load all available matches from database
 * Only shows matches created in the last 5 minutes
 */
async function loadAvailableMatches() {
    console.log('[LOBBY] Loading matches...');
    
    try {
        // Calculate timestamp for 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data: matches, error } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('status', 'waiting')
            .is('guest_id', null)  // Only show matches without a guest
            .gte('created_at', fiveMinutesAgo)  // Only show matches from last 5 minutes
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        lobbyState.availableMatches = matches || [];
        
        renderMatches();
        
    } catch (error) {
        console.error('[LOBBY] Error loading matches:', error);
        document.getElementById('loading-state').innerHTML = 
            '<div style="color: #f44336;">❌ Failed to load matches</div>';
    }
}

/**
 * Render matches to UI
 */
function renderMatches() {
    const loadingState = document.getElementById('loading-state');
    const matchesContainer = document.getElementById('matches-container');
    const matchesGrid = document.getElementById('matches-grid');
    const emptyLobby = document.getElementById('empty-lobby');
    const matchCount = document.getElementById('match-count');
    
    loadingState.style.display = 'none';
    matchesContainer.style.display = 'block';
    
    if (lobbyState.availableMatches.length === 0) {
        matchesGrid.innerHTML = '';
        emptyLobby.style.display = 'block';
        matchCount.textContent = '0';
        return;
    }
    
    emptyLobby.style.display = 'none';
    matchCount.textContent = lobbyState.availableMatches.length;
    
    matchesGrid.innerHTML = lobbyState.availableMatches.map(match => {
        const gameState = match.game_state || {};
        const hostName = gameState.host_name || 'Host';
        const gameType = gameState.game_type || '501';
        const startType = gameState.start_type || 'SI';
        const matchFormat = gameState.match_format || 'single';
        const totalLegs = gameState.total_legs || 1;
        const isMyMatch = match.host_id === lobbyState.myUserId;
        
        // Format display strings
        const gameDisplay = `${gameType} ${startType}DO`;
        const formatDisplay = matchFormat === 'single' ? 'Single Leg' : 
                             matchFormat === 'bo3' ? 'Best of 3' :
                             matchFormat === 'bo5' ? 'Best of 5' :
                             matchFormat === 'bo7' ? 'Best of 7' : `Best of ${totalLegs}`;
        
        return `
            <div class="match-card" 
                 data-match-id="${match.id}"
                 onclick="handleMatchClick('${match.id}', '${match.room_code}', ${isMyMatch})">
                <div class="match-card-header">
                    <div class="match-title">${gameDisplay} ${formatDisplay}</div>
                    <div class="match-status ${isMyMatch ? 'pending' : 'waiting'}">
                        ${isMyMatch ? '🏠 Your Match' : '✓ Available'}
                    </div>
                </div>
                
                <div class="host-name">
                    🎯 Host: ${hostName}
                </div>
                
                <div class="match-info">
                    <div class="match-info-row">
                        <span class="match-info-label">Game Type:</span>
                        <span class="match-info-value">${gameDisplay}</span>
                    </div>
                    <div class="match-info-row">
                        <span class="match-info-label">Format:</span>
                        <span class="match-info-value">${formatDisplay}</span>
                    </div>
                    <div class="match-info-row">
                        <span class="match-info-label">Room Code:</span>
                        <span class="match-info-value">${match.room_code}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Handle match card click - join the match directly
 */
window.handleMatchClick = async function(matchId, roomCode, isMyMatch) {
    if (isMyMatch) {
        alert('This is your match! Wait for players to join.');
        return;
    }
    
    console.log('[LOBBY] Sending join request for match:', matchId);
    
    try {
        // Get the match details
        const { data: match, error: fetchError } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', matchId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Check if someone else already requested
        if (match.game_state?.pending_guest_id) {
            alert('⏳ Another player has already requested to join this match.');
            return;
        }
        
        // Update match status to pending with guest request info
        const { error: updateError } = await window.supabaseClient
            .from('game_rooms')
            .update({
                status: 'pending',
                game_state: {
                    ...match.game_state,
                    pending_guest_id: lobbyState.myUserId,
                    pending_guest_name: lobbyState.myDisplayName
                }
            })
            .eq('id', matchId);
        
        if (updateError) throw updateError;
        
        console.log('[LOBBY] ✅ Join request sent');
        
        // Show guest waiting screen
        showGuestWaitingScreen(match);
        
        // Wait for host response by subscribing to changes
        waitForHostResponse(matchId, roomCode);
        
    } catch (error) {
        console.error('[LOBBY] Error sending join request:', error);
        alert('Failed to send join request. Please try again.');
    }
};

/**
 * Wait for host to accept/decline join request
 */
function waitForHostResponse(matchId, roomCode) {
    console.log('[LOBBY] Waiting for host response...');
    
    const channel = window.supabaseClient
        .channel(`match_${matchId}_response`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${matchId}`
            },
            (payload) => {
                console.log('[LOBBY] Match updated:', payload);
                const updatedMatch = payload.new;
                
                // Check if request was accepted (guest_id set)
                if (updatedMatch.guest_id === lobbyState.myUserId && updatedMatch.status === 'in_progress') {
                    console.log('[LOBBY] ✅ Request accepted!');
                    channel.unsubscribe();
                    
                    alert('✅ Request accepted! Connecting to match...');
                    
                    // Join the match
                    const isInIframe = window.parent !== window;
                    if (isInIframe) {
                        window.parent.postMessage({
                            type: 'LOBBY_JOIN_MATCH',
                            roomCode: roomCode,
                            fromLobby: true
                        }, '*');
                    } else {
                        window.location.href = `./split-screen-online.html?room=${roomCode}&auto=true&fromLobby=true`;
                    }
                }
                // Check if request was declined (pending fields cleared)
                else if (!updatedMatch.game_state?.pending_guest_id && updatedMatch.status === 'waiting') {
                    console.log('[LOBBY] ❌ Request declined');
                    channel.unsubscribe();
                    alert('❌ Host declined your request.');
                }
            }
        )
        .subscribe();
}

// =============================
// UNUSED - Direct Join Mode
// =============================
// These functions were for join request approval system
// Now using instant join via handleMatchClick()
/*
async function sendJoinRequest(matchId) {
    console.log('[LOBBY] Sending join request for match:', matchId);
    
    try {
        const { data, error } = await window.supabaseClient
            .from('join_requests')
            .insert({
                lobby_match_id: matchId,
                requesting_user_id: lobbyState.myUserId,
                requesting_display_name: lobbyState.myDisplayName,
                status: 'pending'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        lobbyState.myPendingRequest = data;
        
        // Refresh UI
        await loadAvailableMatches();
        
        alert('✅ Join request sent! Waiting for host to accept...');
        
    } catch (error) {
        console.error('[LOBBY] Error sending join request:', error);
        alert('Failed to send join request. Please try again.');
    }
}

window.cancelJoinRequest = async function(matchId) {
    console.log('[LOBBY] Cancelling join request for match:', matchId);
    
    try {
        const { error } = await window.supabaseClient
            .from('join_requests')
            .update({ status: 'cancelled' })
            .eq('lobby_match_id', matchId)
            .eq('requesting_user_id', lobbyState.myUserId)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        lobbyState.myPendingRequest = null;
        
        // Refresh UI
        await loadAvailableMatches();
        
        alert('Join request cancelled');
        
    } catch (error) {
        console.error('[LOBBY] Error cancelling request:', error);
        alert('Failed to cancel request');
    }
};
*/

/**
 * Create a new lobby match with configured settings
 */
async function createLobbyMatch() {
    console.log('[LOBBY] Creating new lobby match...');
    
    // Generate unique room code
    const roomCode = generateRoomCode();
    
    // Get match title from input
    const matchTitle = document.getElementById('match-title-input').value || 'Open Match';
    
    // Hide setup modal
    hideMatchSetupModal();
    
    // Determine start type based on game type
    const startType = lobbyState.matchSetup.gameType === '501' ? 'SI' : 'DI';
    
    try {
        const { data: newMatch, error } = await window.supabaseClient
            .from('game_rooms')
            .insert({
                room_code: roomCode,
                host_id: lobbyState.myUserId,
                status: 'waiting',
                game_state: {
                    host_name: lobbyState.myDisplayName,
                    host_player_id: lobbyState.myUserId,
                    game_type: lobbyState.matchSetup.gameType,
                    start_type: startType,
                    match_format: lobbyState.matchSetup.matchFormat,
                    total_legs: lobbyState.matchSetup.totalLegs,
                    match_title: matchTitle
                }
            })
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('[LOBBY] ✅ Match created:', newMatch);
        
        // Store hosted match info
        lobbyState.myHostedMatch = newMatch;
        
        // Show waiting room with timer
        showWaitingRoom(newMatch);
        
        // Start 10-minute countdown timer
        startMatchTimer(newMatch.id);
        
        // Subscribe to join requests for this match
        subscribeToHostMatch(newMatch.id);
        
    } catch (error) {
        console.error('[LOBBY] Error creating match:', error);
        alert('Failed to create match. Please try again.');
    }
}

/**
 * Generate random 4-letter room code
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/**
 * Subscribe to real-time lobby updates
 */
function subscribeToLobbyUpdates() {
    console.log('[LOBBY] Subscribing to real-time updates...');
    
    lobbyState.realtimeChannel = window.supabaseClient
        .channel('lobby_game_rooms_channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_rooms'
            },
            (payload) => {
                console.log('[LOBBY] Match update:', payload);
                loadAvailableMatches();
            }
        )
        .subscribe();
}

/**
 * Show host waiting room after creating a match
 */
function showWaitingRoom(match) {
    console.log('[LOBBY] Showing waiting room for match:', match);
    
    // Hide lobby, show waiting room
    document.querySelector('.lobby-container').style.display = 'none';
    document.getElementById('host-waiting-room').style.display = 'block';
    
    // Populate match details
    const gameState = match.game_state || {};
    const matchTitle = `${gameState.game_type || '501'} ${gameState.start_type || 'SIDO'} ${getFormatLabel(gameState.match_format || 'single')}`;
    
    document.getElementById('waiting-match-title').textContent = matchTitle;
    document.getElementById('waiting-host-name').textContent = lobbyState.myDisplayName;
    document.getElementById('waiting-game-type').textContent = `${gameState.game_type || '501'} ${gameState.start_type || 'SIDO'}`;
    document.getElementById('waiting-format').textContent = getFormatLabel(gameState.match_format || 'single');
    document.getElementById('waiting-room-code').textContent = match.room_code;
}

/**
 * Hide waiting room and return to lobby
 */
function hideWaitingRoom() {
    document.getElementById('host-waiting-room').style.display = 'none';
    document.querySelector('.lobby-container').style.display = 'block';
    
    // Clear hosted match
    lobbyState.myHostedMatch = null;
    
    // Stop timer
    if (lobbyState.matchTimer) {
        clearInterval(lobbyState.matchTimer);
        lobbyState.matchTimer = null;
    }
}

/**
 * Start 10-minute countdown timer for hosted match
 */
function startMatchTimer(matchId) {
    console.log('[LOBBY] Starting 10-minute match timer');
    
    // Set expiry time (10 minutes from now)
    lobbyState.matchExpiryTime = Date.now() + (10 * 60 * 1000);
    
    // Update timer every second
    lobbyState.matchTimer = setInterval(() => {
        const remaining = lobbyState.matchExpiryTime - Date.now();
        
        if (remaining <= 0) {
            // Timer expired - cancel match
            clearInterval(lobbyState.matchTimer);
            autoExpireMatch(matchId);
        } else {
            // Update display
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const timerElement = document.getElementById('match-timer');
            if (timerElement) {
                timerElement.textContent = timerDisplay;
                
                // Change color to red when under 2 minutes
                if (remaining < 2 * 60 * 1000) {
                    timerElement.style.color = '#f44336';
                }
            }
        }
    }, 1000);
}

/**
 * Auto-expire match when timer runs out
 */
async function autoExpireMatch(matchId) {
    console.log('[LOBBY] ⏰ Match timer expired - auto-cancelling');
    
    try {
        await window.supabaseClient
            .from('game_rooms')
            .delete()
            .eq('id', matchId);
        
        alert('⏰ Match expired after 10 minutes.');
        hideWaitingRoom();
        await loadAvailableMatches();
    } catch (error) {
        console.error('[LOBBY] Error expiring match:', error);
    }
}

/**
 * Subscribe to join requests for hosted match
 */
function subscribeToHostMatch(matchId) {
    console.log('[LOBBY] Subscribing to join requests for match:', matchId);
    
    const channel = window.supabaseClient
        .channel(`host_match_${matchId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${matchId}`
            },
            (payload) => {
                console.log('[LOBBY] Host match updated:', payload);
                const updatedMatch = payload.new;
                
                // Check for join request (pending_guest_id set)
                if (updatedMatch.game_state?.pending_guest_id && updatedMatch.status === 'pending') {
                    showJoinRequestNotification(updatedMatch);
                }
            }
        )
        .subscribe();
}

/**
 * Show join request notification to host
 */
function showJoinRequestNotification(match) {
    console.log('[LOBBY] Showing join request notification:', match);
    
    const notification = document.getElementById('join-request-notification');
    const nameElement = document.getElementById('requester-display-name');
    
    nameElement.textContent = match.game_state.pending_guest_name || 'Unknown Player';
    notification.style.display = 'block';
    
    // Store match for accept/decline handlers
    lobbyState.myHostedMatch = match;
}

/**
 * Get format label for display
 */
function getFormatLabel(format) {
    const labels = {
        'single': 'Single Leg',
        'bo3': 'Best of 3',
        'bo5': 'Best of 5',
        'bo7': 'Best of 7'
    };
    return labels[format] || 'Single Leg';
}

/**
 * Show guest waiting screen after sending join request
 */
function showGuestWaitingScreen(match) {
    console.log('[LOBBY] Showing guest waiting screen');
    
    const matchesContainer = document.getElementById('matches-container');
    const loadingState = document.getElementById('loading-state');
    
    if (matchesContainer) matchesContainer.style.display = 'none';
    if (loadingState) {
        loadingState.style.display = 'block';
        loadingState.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px;">⏳</div>
                <h2 style="color: #FFD700; margin-bottom: 10px;">Join Request Sent!</h2>
                <p style="color: #aaa; font-size: 18px; margin-bottom: 30px;">
                    Waiting for <strong style="color: #FFD700;">${match.game_state.host_name}</strong> to accept your request...
                </p>
                <button onclick="cancelJoinRequest('${match.id}')" 
                        style="padding: 15px 40px; font-size: 18px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ✗ Cancel Request
                </button>
            </div>
        `;
    }
}

/**
 * Cancel guest's own join request
 */
window.cancelJoinRequest = async function(matchId) {
    console.log('[LOBBY] Cancelling join request');
    
    try {
        // Get current match
        const { data: match, error: fetchError } = await window.supabaseClient
            .from('game_rooms')
            .select('*')
            .eq('id', matchId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Clear pending guest info
        const { error: updateError } = await window.supabaseClient
            .from('game_rooms')
            .update({
                status: 'waiting',
                game_state: {
                    ...match.game_state,
                    pending_guest_id: null,
                    pending_guest_name: null
                }
            })
            .eq('id', matchId);
        
        if (updateError) throw updateError;
        
        console.log('[LOBBY] ✅ Join request cancelled');
        
        // Return to lobby
        window.location.reload();
        
    } catch (error) {
        console.error('[LOBBY] Error cancelling request:', error);
        alert('Failed to cancel request.');
    }
};

/**
 * Subscribe to join requests - not needed anymore since using real-time
 */
function subscribeToJoinRequests() {
    console.log('[LOBBY] Using real-time subscriptions for join requests');
}

/*
// UNUSED - Direct join mode (no approval needed)
function showJoinRequestModal(request) {
    lobbyState.currentJoinRequest = request;
    
    document.getElementById('requester-name').textContent = request.requesting_display_name;
    document.getElementById('join-request-modal').classList.add('active');
    
    console.log('[LOBBY] Showing join request modal:', request);
}
*/

/*
async function acceptJoinRequest() {
    if (!lobbyState.currentJoinRequest) return;
    
    console.log('[LOBBY] Accepting join request:', lobbyState.currentJoinRequest);
    
    try {
        // Update request status
        const { error: requestError } = await window.supabaseClient
            .from('join_requests')
            .update({ status: 'accepted' })
            .eq('id', lobbyState.currentJoinRequest.id);
        
        if (requestError) throw requestError;
        
        // Update match status with joined player
        const { data: match, error: matchError } = await window.supabaseClient
            .from('lobby_matches')
            .update({
                status: 'in_progress',
                joined_user_id: lobbyState.currentJoinRequest.requesting_user_id,
                joined_display_name: lobbyState.currentJoinRequest.requesting_display_name
            })
            .eq('id', lobbyState.currentJoinRequest.lobby_match_id)
            .select()
            .single();
        
        if (matchError) throw matchError;
        
        // Hide modal
        document.getElementById('join-request-modal').classList.remove('active');
        
        console.log('[LOBBY] ✅ Join request accepted, match:', match);
        
        // Build URL with match config for auto-start
        const matchConfig = {
            room: match.room_code,
            auto: 'true',
            gameType: match.game_type,
            startScore: match.start_score,
            doubleIn: match.double_in,
            doubleOut: match.double_out,
            totalLegs: match.total_legs,
            hostName: match.host_display_name,
            guestName: match.joined_display_name,
            fromLobby: 'true'
        };
        
        const params = new URLSearchParams(matchConfig);
        
        alert('✅ Player accepted! Connecting to match...');
        
        // Redirect to split-screen with full match config
        window.location.href = `./split-screen-online.html?${params.toString()}`;
        
    } catch (error) {
        console.error('[LOBBY] Error accepting request:', error);
        alert('Failed to accept request. Please try again.');
    }
}

async function declineJoinRequest() {
    if (!lobbyState.currentJoinRequest) return;
    
    console.log('[LOBBY] Declining join request:', lobbyState.currentJoinRequest);
    
    try {
        const { error } = await window.supabaseClient
            .from('join_requests')
            .update({ status: 'declined' })
            .eq('id', lobbyState.currentJoinRequest.id);
        
        if (error) throw error;
        
        // Hide modal
        document.getElementById('join-request-modal').classList.remove('active');
        lobbyState.currentJoinRequest = null;
        
        alert('Join request declined');
        
    } catch (error) {
        console.error('[LOBBY] Error declining request:', error);
        alert('Failed to decline request');
    }
}
*/

/**
 * Cancel hosted match button handler
 */
document.getElementById('cancel-hosted-match-btn')?.addEventListener('click', async () => {
    console.log('[LOBBY] Cancelling hosted match');
    
    if (!lobbyState.myHostedMatch) return;
    
    if (!confirm('Are you sure you want to cancel this match?')) return;
    
    try {
        await window.supabaseClient
            .from('game_rooms')
            .delete()
            .eq('id', lobbyState.myHostedMatch.id);
        
        console.log('[LOBBY] ✅ Match cancelled');
        hideWaitingRoom();
        await loadAvailableMatches();
    } catch (error) {
        console.error('[LOBBY] Error cancelling match:', error);
        alert('Failed to cancel match.');
    }
});

/**
 * Accept join request button handler
 */
document.getElementById('accept-join-request-btn')?.addEventListener('click', async () => {
    console.log('[LOBBY] Accepting join request');
    
    if (!lobbyState.myHostedMatch) return;
    
    const match = lobbyState.myHostedMatch;
    const pendingGuestId = match.game_state?.pending_guest_id;
    const pendingGuestName = match.game_state?.pending_guest_name;
    
    if (!pendingGuestId) {
        alert('No pending join request found.');
        return;
    }
    
    try {
        // Update match: move pending guest to actual guest, set status to in_progress
        const { error } = await window.supabaseClient
            .from('game_rooms')
            .update({
                guest_id: pendingGuestId,
                status: 'in_progress',
                game_state: {
                    ...match.game_state,
                    guest_name: pendingGuestName,
                    guest_player_id: pendingGuestId,
                    pending_guest_id: null,
                    pending_guest_name: null
                }
            })
            .eq('id', match.id);
        
        if (error) throw error;
        
        console.log('[LOBBY] ✅ Join request accepted - starting match');
        
        // Stop timer
        if (lobbyState.matchTimer) {
            clearInterval(lobbyState.matchTimer);
        }
        
        // Navigate to match
        const roomCode = match.room_code;
        const isInIframe = window.parent !== window;
        
        if (isInIframe) {
            window.parent.postMessage({
                type: 'LOBBY_JOIN_MATCH',
                roomCode: roomCode,
                fromLobby: true
            }, '*');
        } else {
            window.location.href = `./split-screen-online.html?room=${roomCode}&auto=true&fromLobby=true`;
        }
        
    } catch (error) {
        console.error('[LOBBY] Error accepting join request:', error);
        alert('Failed to accept join request.');
    }
});

/**
 * Decline join request button handler
 */
document.getElementById('decline-join-request-btn')?.addEventListener('click', async () => {
    console.log('[LOBBY] Declining join request');
    
    if (!lobbyState.myHostedMatch) return;
    
    const match = lobbyState.myHostedMatch;
    
    try {
        // Clear pending guest info and return to waiting status
        const { error } = await window.supabaseClient
            .from('game_rooms')
            .update({
                status: 'waiting',
                game_state: {
                    ...match.game_state,
                    pending_guest_id: null,
                    pending_guest_name: null
                }
            })
            .eq('id', match.id);
        
        if (error) throw error;
        
        console.log('[LOBBY] ✅ Join request declined');
        
        // Hide notification
        document.getElementById('join-request-notification').style.display = 'none';
        
    } catch (error) {
        console.error('[LOBBY] Error declining join request:', error);
        alert('Failed to decline join request.');
    }
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    if (lobbyState.realtimeChannel) {
        lobbyState.realtimeChannel.unsubscribe();
    }
    if (lobbyState.joinRequestListener) {
        lobbyState.joinRequestListener.unsubscribe();
    }
    if (lobbyState.matchTimer) {
        clearInterval(lobbyState.matchTimer);
    }
});
