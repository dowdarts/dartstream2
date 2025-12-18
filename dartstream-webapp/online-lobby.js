/**
 * Online Lobby System
 * Allows players to browse public matches and join via request system
 * Integrates with both online scorer and video call (split-screen mode)
 */

let lobbyState = {
    currentUser: null,
    myDisplayName: null,
    myUserId: null,
    availableMatches: [],
    myPendingRequest: null,
    realtimeChannel: null,
    joinRequestListener: null,
    currentJoinRequest: null,  // For hosts receiving requests
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
    
    // Join request modal buttons
    document.getElementById('accept-request-btn').addEventListener('click', acceptJoinRequest);
    document.getElementById('decline-request-btn').addEventListener('click', declineJoinRequest);
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
 */
async function loadAvailableMatches() {
    console.log('[LOBBY] Loading matches...');
    
    try {
        const { data: matches, error } = await window.supabaseClient
            .from('lobby_matches')
            .select('*')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        lobbyState.availableMatches = matches || [];
        
        // Check if user has any pending requests
        const { data: myRequests } = await window.supabaseClient
            .from('join_requests')
            .select('*, lobby_matches(*)')
            .eq('requesting_user_id', lobbyState.myUserId)
            .eq('status', 'pending')
            .single();
        
        if (myRequests) {
            lobbyState.myPendingRequest = myRequests;
        }
        
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
        const isPending = lobbyState.myPendingRequest && 
                         lobbyState.myPendingRequest.lobby_match_id === match.id;
        const isMyMatch = match.host_user_id === lobbyState.myUserId;
        
        return `
            <div class="match-card ${isPending ? 'pending-request' : ''}" 
                 data-match-id="${match.id}"
                 onclick="handleMatchClick('${match.id}', ${isMyMatch})">
                <div class="match-card-header">
                    <div class="match-title">${match.match_title}</div>
                    <div class="match-status ${isPending ? 'pending' : 'waiting'}">
                        ${isPending ? '⏳ Pending' : isMyMatch ? '🏠 Your Match' : '✓ Available'}
                    </div>
                </div>
                
                <div class="host-name">
                    🎯 Host: ${match.host_display_name}
                </div>
                
                <div class="match-info">
                    <div class="match-info-row">
                        <span class="match-info-label">Game Type:</span>
                        <span class="match-info-value">${match.game_type} ${match.double_in ? 'DI' : 'SI'}/${match.double_out ? 'DO' : 'SO'}</span>
                    </div>
                    <div class="match-info-row">
                        <span class="match-info-label">Format:</span>
                        <span class="match-info-value">${match.total_legs === 1 ? 'Single Leg' : 'Best of ' + match.total_legs}</span>
                    </div>
                    <div class="match-info-row">
                        <span class="match-info-label">Room Code:</span>
                        <span class="match-info-value">${match.room_code}</span>
                    </div>
                </div>
                
                ${isPending ? `
                    <button class="cancel-request-btn" onclick="event.stopPropagation(); cancelJoinRequest('${match.id}')">
                        Cancel Request
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Handle match card click
 */
window.handleMatchClick = async function(matchId, isMyMatch) {
    if (isMyMatch) {
        alert('This is your match! Wait for players to request to join.');
        return;
    }
    
    // Check if already have pending request
    if (lobbyState.myPendingRequest && lobbyState.myPendingRequest.lobby_match_id === matchId) {
        alert('You already have a pending request for this match!');
        return;
    }
    
    // Send join request
    await sendJoinRequest(matchId);
};

/**
 * Send join request to match host
 */
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

/**
 * Cancel join request
 */
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
    
    try {
        const { data: newMatch, error } = await window.supabaseClient
            .from('lobby_matches')
            .insert({
                host_user_id: lobbyState.myUserId,
                host_display_name: lobbyState.myDisplayName,
                room_code: roomCode,
                match_title: matchTitle,
                game_type: lobbyState.matchSetup.gameType,
                start_score: lobbyState.matchSetup.startScore,
                double_in: lobbyState.matchSetup.doubleIn,
                double_out: lobbyState.matchSetup.doubleOut,
                total_legs: lobbyState.matchSetup.totalLegs,
                status: 'waiting'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('[LOBBY] ✅ Match created:', newMatch);
        
        // Store match ID and settings for listening to join requests
        localStorage.setItem('hosting_lobby_match_id', newMatch.id);
        localStorage.setItem('hosting_lobby_match_settings', JSON.stringify({
            roomCode: roomCode,
            gameType: lobbyState.matchSetup.gameType,
            startScore: lobbyState.matchSetup.startScore,
            doubleIn: lobbyState.matchSetup.doubleIn,
            doubleOut: lobbyState.matchSetup.doubleOut,
            totalLegs: lobbyState.matchSetup.totalLegs,
            matchFormat: lobbyState.matchSetup.matchFormat
        }));
        
        alert(`✅ Match created! Room Code: ${roomCode}\nWaiting for players in lobby...`);
        
        // Refresh matches
        await loadAvailableMatches();
        
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
        .channel('lobby_matches_channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'lobby_matches'
            },
            (payload) => {
                console.log('[LOBBY] Match update:', payload);
                loadAvailableMatches();
            }
        )
        .subscribe();
}

/**
 * Subscribe to join requests for hosted matches
 */
function subscribeToJoinRequests() {
    console.log('[LOBBY] Subscribing to join requests...');
    
    lobbyState.joinRequestListener = window.supabaseClient
        .channel('join_requests_channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'join_requests',
                filter: `status=eq.pending`
            },
            async (payload) => {
                console.log('[LOBBY] Join request received:', payload);
                
                // Check if this request is for my match
                const request = payload.new;
                const hostingMatchId = localStorage.getItem('hosting_lobby_match_id');
                
                if (request.lobby_match_id === hostingMatchId) {
                    // Show accept/decline modal
                    showJoinRequestModal(request);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'join_requests',
                filter: `requesting_user_id=eq.${lobbyState.myUserId}`
            },
            async (payload) => {
                console.log('[LOBBY] Join request updated:', payload);
                
                const request = payload.new;
                
                // If my request was accepted, redirect to match
                if (request.status === 'accepted' && lobbyState.myPendingRequest) {
                    // Get match details
                    const { data: match } = await window.supabaseClient
                        .from('lobby_matches')
                        .select('*')
                        .eq('id', request.lobby_match_id)
                        .single();
                    
                    if (match) {
                        alert('✅ Request accepted! Connecting to match...');
                        
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
                        
                        // Redirect to split-screen with full match config
                        window.location.href = `./split-screen-online.html?${params.toString()}`;
                    }
                }
                
                // If declined, show notification
                if (request.status === 'declined') {
                    alert('❌ Host declined your join request');
                    lobbyState.myPendingRequest = null;
                    await loadAvailableMatches();
                }
            }
        )
        .subscribe();
}

/**
 * Show join request modal for hosts
 */
function showJoinRequestModal(request) {
    lobbyState.currentJoinRequest = request;
    
    document.getElementById('requester-name').textContent = request.requesting_display_name;
    document.getElementById('join-request-modal').classList.add('active');
    
    console.log('[LOBBY] Showing join request modal:', request);
}

/**
 * Accept join request
 */
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

/**
 * Decline join request
 */
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
});
