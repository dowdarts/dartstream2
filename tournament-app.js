// Tournament Portal Application Logic
// Main JavaScript file for tournament management

// State management
const tournamentState = {
    currentScreen: 'portal-selection-screen',
    currentSection: 'overview',
    currentTournament: null,
    currentBoard: null,
    selectedPlayers: [],
    activePlayers: [],
    activeMatch: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tournament Portal initialized');
    initializeEventListeners();
    getTournamentSupabaseClient();
});

// Event Listeners Setup
function initializeEventListeners() {
    // Portal selection buttons
    document.getElementById('director-portal-btn')?.addEventListener('click', () => switchScreen('director-portal-screen'));
    document.getElementById('scoring-tablet-btn')?.addEventListener('click', () => switchScreen('scoring-tablet-screen'));
    document.getElementById('tv-display-btn')?.addEventListener('click', () => switchScreen('tv-display-screen'));
    document.getElementById('back-to-main-app')?.addEventListener('click', () => window.location.href = 'scoring-app.html');
    
    // Back buttons
    document.getElementById('back-from-director')?.addEventListener('click', () => switchScreen('portal-selection-screen'));
    document.getElementById('back-from-tablet')?.addEventListener('click', () => switchScreen('portal-selection-screen'));
    document.getElementById('back-from-tv')?.addEventListener('click', () => switchScreen('portal-selection-screen'));
    
    // Director navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            switchDirectorSection(section);
        });
    });
    
    // Quick create button
    document.querySelector('.create-tournament-quick-btn')?.addEventListener('click', () => {
        switchDirectorSection('create');
    });
    
    // Add player button
    document.getElementById('add-player-btn')?.addEventListener('click', showAddPlayerModal);
    
    // Create tournament button
    document.getElementById('create-tournament-btn')?.addEventListener('click', createTournament);
    
    // Tablet submit buttons
    document.getElementById('submit-leg-btn')?.addEventListener('click', submitLeg);
    document.getElementById('complete-match-btn')?.addEventListener('click', completeMatch);
    
    // Initialize drag and drop for tiebreaker priority
    initializeTiebreakerDragDrop();
}

// Screen switching
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
    tournamentState.currentScreen = screenId;
    
    // Load data when switching to specific screens
    if (screenId === 'director-portal-screen') {
        loadTournaments();
        loadPlayers();
    } else if (screenId === 'scoring-tablet-screen') {
        showBoardSelection();
    } else if (screenId === 'tv-display-screen') {
        loadTVDisplay();
    }
}

// Director section switching
function switchDirectorSection(sectionId) {
    document.querySelectorAll('.director-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`section-${sectionId}`)?.classList.add('active');
    document.querySelector(`.nav-btn[data-section="${sectionId}"]`)?.classList.add('active');
    
    tournamentState.currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'players') {
        loadPlayers();
    } else if (sectionId === 'create') {
        loadPlayersForSelection();
    } else if (sectionId === 'matches') {
        loadMatches();
    } else if (sectionId === 'standings') {
        loadStandings();
    } else if (sectionId === 'bracket') {
        loadBracket();
    }
}

// Player Management
async function loadPlayers() {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        const { data, error } = await client
            .from(TABLES.PLAYERS)
            .select('*')
            .eq('is_active', true)
            .order('username');
        
        if (error) throw error;
        
        tournamentState.activePlayers = data || [];
        renderPlayersList(data || []);
    } catch (error) {
        console.error('Error loading players:', error);
        showError('Failed to load players');
    }
}

function renderPlayersList(players) {
    const container = document.getElementById('players-list');
    if (!container) return;
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No players found. Add your first player to get started.</p></div>';
        return;
    }
    
    container.innerHTML = players.map(player => `
        <div class="player-card" data-player-id="${player.id}">
            <h3>${player.username}</h3>
            <div class="player-stats">
                <div class="stat">
                    <div class="stat-value">0.00</div>
                    <div class="stat-label">Avg</div>
                </div>
                <div class="stat">
                    <div class="stat-value">0</div>
                    <div class="stat-label">180s</div>
                </div>
                <div class="stat">
                    <div class="stat-value">0</div>
                    <div class="stat-label">Wins</div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddPlayerModal() {
    const playerName = prompt('Enter player name:');
    if (playerName && playerName.trim()) {
        addPlayer(playerName.trim());
    }
}

async function addPlayer(playerName) {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        const { data, error } = await client
            .from(TABLES.PLAYERS)
            .insert([{ username: playerName, is_active: true }])
            .select();
        
        if (error) throw error;
        
        showSuccess(`Player "${playerName}" added successfully`);
        loadPlayers();
    } catch (error) {
        console.error('Error adding player:', error);
        showError('Failed to add player');
    }
}

// Tournament Creation
async function loadPlayersForSelection() {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        const { data, error } = await client
            .from(TABLES.PLAYERS)
            .select('*')
            .eq('is_active', true)
            .order('username');
        
        if (error) throw error;
        
        renderPlayerSelection(data || []);
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

function renderPlayerSelection(players) {
    const container = document.getElementById('player-selection');
    if (!container) return;
    
    container.innerHTML = players.map(player => `
        <div class="player-select-item" data-player-id="${player.id}">
            ${player.username}
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.player-select-item').forEach(item => {
        item.addEventListener('click', () => togglePlayerSelection(item));
    });
}

function togglePlayerSelection(item) {
    const playerId = item.dataset.playerId;
    const index = tournamentState.selectedPlayers.indexOf(playerId);
    
    if (index > -1) {
        tournamentState.selectedPlayers.splice(index, 1);
        item.classList.remove('selected');
    } else {
        if (tournamentState.selectedPlayers.length >= 10) {
            showError('Maximum 10 players can be selected');
            return;
        }
        tournamentState.selectedPlayers.push(playerId);
        item.classList.add('selected');
    }
}

async function createTournament() {
    const name = document.getElementById('tournament-name')?.value;
    const scoringMethod = document.getElementById('scoring-method')?.value;
    const gameFormat = document.getElementById('game-format')?.value;
    const numBoards = parseInt(document.getElementById('num-boards')?.value) || 2;
    
    if (!name || !name.trim()) {
        showError('Please enter a tournament name');
        return;
    }
    
    if (tournamentState.selectedPlayers.length !== 10) {
        showError('Please select exactly 10 players');
        return;
    }
    
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        // Get tiebreaker priority order
        const tiebreakerPriority = Array.from(document.querySelectorAll('.tiebreaker-item'))
            .map(item => item.dataset.field);
        
        // Create tournament
        const { data: tournament, error: tournamentError } = await client
            .from(TABLES.TOURNAMENTS)
            .insert([{
                name: name.trim(),
                status: TOURNAMENT_STATUS.SETUP,
                scoring_method: scoringMethod,
                game_format: gameFormat,
                num_boards: numBoards,
                tie_breaker_priority: tiebreakerPriority
            }])
            .select()
            .single();
        
        if (tournamentError) throw tournamentError;
        
        // Assign players to groups
        const shuffled = [...tournamentState.selectedPlayers].sort(() => Math.random() - 0.5);
        const groupA = shuffled.slice(0, 5);
        const groupB = shuffled.slice(5, 10);
        
        const tournamentPlayers = [
            ...groupA.map((id, index) => ({ tournament_id: tournament.id, player_id: id, group_name: 'A', seed: index + 1 })),
            ...groupB.map((id, index) => ({ tournament_id: tournament.id, player_id: id, group_name: 'B', seed: index + 1 }))
        ];
        
        const { error: playersError } = await client
            .from(TABLES.TOURNAMENT_PLAYERS)
            .insert(tournamentPlayers);
        
        if (playersError) throw playersError;
        
        // Generate round robin matches
        await generateRoundRobinMatches(tournament.id, groupA, groupB, numBoards);
        
        showSuccess('Tournament created successfully!');
        tournamentState.selectedPlayers = [];
        switchDirectorSection('overview');
        loadTournaments();
        
    } catch (error) {
        console.error('Error creating tournament:', error);
        showError('Failed to create tournament');
    }
}

async function generateRoundRobinMatches(tournamentId, groupA, groupB, numBoards) {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    const matches = [];
    let boardIndex = 0;
    
    // Generate matches for Group A
    for (let i = 0; i < groupA.length; i++) {
        for (let j = i + 1; j < groupA.length; j++) {
            matches.push({
                tournament_id: tournamentId,
                player1_id: groupA[i],
                player2_id: groupA[j],
                stage: MATCH_STAGE.ROUND_ROBIN,
                group_name: 'A',
                board_id: `Board ${(boardIndex % numBoards) + 1}`,
                status: MATCH_STATUS.PENDING
            });
            boardIndex++;
        }
    }
    
    // Generate matches for Group B
    for (let i = 0; i < groupB.length; i++) {
        for (let j = i + 1; j < groupB.length; j++) {
            matches.push({
                tournament_id: tournamentId,
                player1_id: groupB[i],
                player2_id: groupB[j],
                stage: MATCH_STAGE.ROUND_ROBIN,
                group_name: 'B',
                board_id: `Board ${(boardIndex % numBoards) + 1}`,
                status: MATCH_STATUS.PENDING
            });
            boardIndex++;
        }
    }
    
    const { error } = await client
        .from(TABLES.MATCHES)
        .insert(matches);
    
    if (error) throw error;
}

// Tournament Management
async function loadTournaments() {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        const { data, error } = await client
            .from(TABLES.TOURNAMENTS)
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderTournamentList(data || []);
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

function renderTournamentList(tournaments) {
    const container = document.getElementById('tournament-list');
    if (!container) return;
    
    if (tournaments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No active tournaments</p>
                <button class="create-tournament-quick-btn">Create Your First Tournament</button>
            </div>`;
        return;
    }
    
    container.innerHTML = tournaments.map(t => `
        <div class="tournament-card" data-tournament-id="${t.id}">
            <h3>${t.name}</h3>
            <p>Status: ${t.status}</p>
            <p>Format: ${t.game_format} | Scoring: ${t.scoring_method}</p>
        </div>
    `).join('');
}

// Match Control Functions
async function loadMatches() {
    // TODO: Implement match loading and control
    console.log('Loading matches...');
}

async function loadStandings() {
    // TODO: Implement standings loading
    console.log('Loading standings...');
}

async function loadBracket() {
    // TODO: Implement bracket loading
    console.log('Loading bracket...');
}

// Scoring Tablet Functions
function showBoardSelection() {
    const numBoards = 2; // TODO: Get from current tournament
    const container = document.getElementById('board-options');
    if (!container) return;
    
    container.innerHTML = Array.from({ length: numBoards }, (_, i) => `
        <button class="board-btn" data-board-id="${i + 1}">Board ${i + 1}</button>
    `).join('');
    
    container.querySelectorAll('.board-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBoard(btn.dataset.boardId));
    });
    
    document.getElementById('board-selection')?.classList.add('active');
    document.getElementById('waiting-for-match')?.classList.remove('active');
    document.getElementById('active-match-scoring')?.classList.remove('active');
}

function selectBoard(boardId) {
    tournamentState.currentBoard = `Board ${boardId}`;
    document.getElementById('board-id-display').textContent = tournamentState.currentBoard;
    document.getElementById('current-board-name').textContent = tournamentState.currentBoard;
    
    document.getElementById('board-selection')?.classList.remove('active');
    document.getElementById('waiting-for-match')?.classList.add('active');
    
    // TODO: Start listening for match assignments
    listenForMatchAssignment();
}

async function listenForMatchAssignment() {
    // TODO: Implement real-time listener for match assignments
    console.log('Listening for match assignments on', tournamentState.currentBoard);
}

async function submitLeg() {
    // TODO: Implement leg submission
    console.log('Submitting leg...');
}

async function completeMatch() {
    // TODO: Implement match completion
    console.log('Completing match...');
}

// TV Display Functions
async function loadTVDisplay() {
    // TODO: Implement TV display loading
    console.log('Loading TV display...');
}

// Tiebreaker Drag and Drop
function initializeTiebreakerDragDrop() {
    const items = document.querySelectorAll('.tiebreaker-item');
    let draggedItem = null;
    
    items.forEach(item => {
        item.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });
        
        item.addEventListener('dragend', function() {
            setTimeout(() => this.style.opacity = '1', 0);
            draggedItem = null;
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem !== this) {
                const allItems = [...document.querySelectorAll('.tiebreaker-item')];
                const draggedIndex = allItems.indexOf(draggedItem);
                const targetIndex = allItems.indexOf(this);
                
                if (draggedIndex < targetIndex) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }
                
                updateTiebreakerNumbers();
            }
        });
    });
}

function updateTiebreakerNumbers() {
    document.querySelectorAll('.tiebreaker-item').forEach((item, index) => {
        const text = item.textContent.replace(/^\d+\.\s/, '');
        item.textContent = `${index + 1}. ${text}`;
    });
}

// Utility Functions
function showError(message) {
    alert('Error: ' + message);
    console.error(message);
}

function showSuccess(message) {
    alert(message);
    console.log(message);
}
