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
    
    // Add player modal controls
    document.getElementById('close-add-player-modal')?.addEventListener('click', closeAddPlayerModal);
    document.getElementById('add-player-cancel')?.addEventListener('click', closeAddPlayerModal);
    document.getElementById('add-player-submit')?.addEventListener('click', submitNewPlayer);
    
    // Create tournament button
    document.getElementById('create-tournament-btn')?.addEventListener('click', createTournament);
    
    // Group configuration listeners
    document.getElementById('num-groups')?.addEventListener('change', calculateGroupBreakdown);
    
    // Standings controls
    document.getElementById('refresh-standings-btn')?.addEventListener('click', loadStandings);
    document.getElementById('manual-override-btn')?.addEventListener('click', showManualOverrideModal);
    document.getElementById('finalize-groups-btn')?.addEventListener('click', finalizeGroupsAndGenerateBracket);
    document.getElementById('close-override-modal')?.addEventListener('click', closeManualOverrideModal);
    document.getElementById('cancel-override-btn')?.addEventListener('click', closeManualOverrideModal);
    document.getElementById('save-override-btn')?.addEventListener('click', saveManualOverride);
    
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

// Generate 4-digit connection code for boards
function generateBoardConnectionCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Player Management
async function loadPlayers() {
    console.log('Loading players...');
    const client = getTournamentSupabaseClient();
    if (!client) {
        console.error('Supabase client not available');
        showError('Database connection not available. Please refresh the page.');
        return;
    }
    
    try {
        console.log('Fetching from table:', TABLES.PLAYERS);
        const { data, error } = await client
            .from(TABLES.PLAYERS)
            .select('*')
            .order('first_name');
        
        console.log('Players fetch result:', { data, error });
        
        if (error) throw error;
        
        // Transform to include full name
        const players = (data || []).map(p => ({
            ...p,
            fullName: `${p.first_name} ${p.last_name}`
        }));
        
        console.log('Processed players:', players.length);
        tournamentState.activePlayers = players;
        renderPlayersList(players);
    } catch (error) {
        console.error('Error loading players:', error);
        showError('Failed to load players: ' + error.message);
    }
}

function renderPlayersList(players) {
    console.log('Rendering players list:', players.length);
    const container = document.getElementById('players-list');
    if (!container) {
        console.error('players-list container not found');
        return;
    }
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No players found. Add your first player to get started.</p></div>';
        return;
    }
    
    container.innerHTML = players.map(player => `
        <div class="player-card" data-player-id="${player.id}">
            <h3>${player.first_name} ${player.last_name}</h3>
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
    console.log('Players rendered successfully');
}

function showAddPlayerModal() {
    console.log('Opening add player modal');
    const firstNameInput = document.getElementById('new-player-firstname');
    const lastNameInput = document.getElementById('new-player-lastname');
    const modal = document.getElementById('add-player-modal');
    
    if (!firstNameInput || !lastNameInput || !modal) {
        console.error('Modal elements not found');
        return;
    }
    
    firstNameInput.value = '';
    lastNameInput.value = '';
    modal.classList.add('active');
    firstNameInput.focus();
    
    // Add Enter key support
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            submitNewPlayer();
        }
    };
    firstNameInput.addEventListener('keypress', handleEnter);
    lastNameInput.addEventListener('keypress', handleEnter);
}

function closeAddPlayerModal() {
    document.getElementById('add-player-modal').classList.remove('active');
}

async function submitNewPlayer() {
    console.log('Submitting new player');
    const firstName = document.getElementById('new-player-firstname').value.trim();
    const lastName = document.getElementById('new-player-lastname').value.trim();
    
    console.log('Player details:', { firstName, lastName });
    
    if (!firstName || !lastName) {
        showError('Please enter both first and last name');
        return;
    }
    
    await addPlayer(firstName, lastName);
    closeAddPlayerModal();
}

async function addPlayer(firstName, lastName) {
    console.log('Adding player to database:', firstName, lastName);
    const client = getTournamentSupabaseClient();
    if (!client) {
        console.error('No Supabase client available');
        showError('Database connection not available');
        return;
    }
    
    try {
        console.log('Inserting into table:', TABLES.PLAYERS);
        const { data, error } = await client
            .from(TABLES.PLAYERS)
            .insert([{ first_name: firstName, last_name: lastName }])
            .select();
        
        console.log('Insert result:', { data, error });
        
        if (error) throw error;
        
        showSuccess(`Player "${firstName} ${lastName}" added successfully`);
        loadPlayers();
    } catch (error) {
        console.error('Error adding player:', error);
        showError('Failed to add player: ' + error.message);
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
            .order('first_name');
        
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
            ${player.first_name} ${player.last_name}
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
        if (tournamentState.selectedPlayers.length >= 64) {
            showError('Maximum 64 players can be selected');
            return;
        }
        tournamentState.selectedPlayers.push(playerId);
        item.classList.add('selected');
    }
    
    // Update player count display
    updatePlayerCountDisplay();
    calculateGroupBreakdown();
}

function updatePlayerCountDisplay() {
    const countEl = document.getElementById('selected-player-count');
    if (countEl) {
        countEl.textContent = tournamentState.selectedPlayers.length;
    }
}

function calculateGroupBreakdown() {
    const numPlayers = tournamentState.selectedPlayers.length;
    const numGroups = parseInt(document.getElementById('num-groups')?.value) || 2;
    const breakdownEl = document.getElementById('group-breakdown');
    
    if (!breakdownEl || numPlayers < 2) {
        if (breakdownEl) breakdownEl.innerHTML = '<p style="color: #888;">Select at least 2 players to see group breakdown</p>';
        return;
    }
    
    const groupSizes = calculateOptimalGroupSizes(numPlayers, numGroups);
    const groupLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    let html = '';
    groupSizes.forEach((size, index) => {
        html += `<div class="group-info">Group ${groupLabels[index]}: ${size} players</div>`;
    });
    
    breakdownEl.innerHTML = html;
}

function calculateOptimalGroupSizes(totalPlayers, numGroups) {
    const baseSize = Math.floor(totalPlayers / numGroups);
    const remainder = totalPlayers % numGroups;
    
    const sizes = [];
    for (let i = 0; i < numGroups; i++) {
        // Distribute the remainder across groups (each group can be at most +1 from base)
        sizes.push(i < remainder ? baseSize + 1 : baseSize);
    }
    
    return sizes;
}

async function createTournament() {
    const name = document.getElementById('tournament-name')?.value;
    const scoringMethod = document.getElementById('scoring-method')?.value;
    const gameFormat = document.getElementById('game-format')?.value;
    const numBoards = parseInt(document.getElementById('num-boards')?.value) || 2;
    const numGroups = parseInt(document.getElementById('num-groups')?.value) || 2;
    const playersAdvancing = parseInt(document.getElementById('players-advancing')?.value) || 2;
    
    if (!name || !name.trim()) {
        showError('Please enter a tournament name');
        return;
    }
    
    if (tournamentState.selectedPlayers.length < 2) {
        showError('Please select at least 2 players');
        return;
    }
    
    if (tournamentState.selectedPlayers.length > 64) {
        showError('Maximum 64 players allowed');
        return;
    }
    
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        // Create tournament with ONLY the columns PostgREST knows about
        // Just use name, status, scoring_method, game_format - everything else uses defaults
        const { data: insertData, error: insertError } = await client
            .from(TABLES.TOURNAMENTS)
            .insert([{
                name: name.trim(),
                status: TOURNAMENT_STATUS.SETUP,
                scoring_method: scoringMethod,
                game_format: gameFormat
            }]);
        
        if (insertError) throw insertError;
        
        // Fetch the created tournament
        const { data: tournament, error: fetchError } = await client
            .from(TABLES.TOURNAMENTS)
            .select('*')
            .eq('name', name.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Use default values for everything else (they're set in the database)
        // num_boards defaults to 2, num_groups defaults to 2, players_advancing defaults to 2
        const actualNumBoards = tournament.num_boards || 2;
        const actualNumGroups = tournament.num_groups || 2;
        const actualPlayersAdvancing = tournament.players_advancing || 2;
        
        // Calculate group sizes and assign players
        const groupSizes = calculateOptimalGroupSizes(tournamentState.selectedPlayers.length, actualNumGroups);
        const shuffled = [...tournamentState.selectedPlayers].sort(() => Math.random() - 0.5);
        const groupLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        
        const tournamentPlayers = [];
        let playerIndex = 0;
        
        groupSizes.forEach((size, groupIndex) => {
            for (let i = 0; i < size; i++) {
                tournamentPlayers.push({
                    tournament_id: tournament.id,
                    player_id: shuffled[playerIndex],
                    group_name: groupLabels[groupIndex],
                    seed: i + 1
                });
                playerIndex++;
            }
        });
        
        const { error: playersError } = await client
            .from(TABLES.TOURNAMENT_PLAYERS)
            .insert(tournamentPlayers);
        
        if (playersError) throw playersError;
        
        // Create board records with connection codes
        const boards = [];
        for (let i = 1; i <= actualNumBoards; i++) {
            boards.push({
                tournament_id: tournament.id,
                board_number: i,
                board_name: `Board ${i}`,
                connection_code: generateBoardConnectionCode(),
                is_active: true
            });
        }
        
        const { error: boardsError } = await client
            .from(TABLES.BOARDS)
            .insert(boards);
        
        if (boardsError) throw boardsError;
        
        // Generate round robin matches for all groups
        await generateRoundRobinMatchesAllGroups(tournament.id, groupSizes, groupLabels, shuffled, actualNumBoards);
        
        showSuccess('Tournament created successfully!');
        tournamentState.selectedPlayers = [];
        updatePlayerCountDisplay();
        switchDirectorSection('overview');
        loadTournaments();
        
    } catch (error) {
        console.error('Error creating tournament:', error);
        showError('Failed to create tournament');
    }
}

async function generateRoundRobinMatchesAllGroups(tournamentId, groupSizes, groupLabels, allPlayers, numBoards) {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    const matches = [];
    let boardIndex = 0;
    let playerIndex = 0;
    
    // Generate matches for each group
    groupSizes.forEach((groupSize, groupIndex) => {
        const groupPlayers = allPlayers.slice(playerIndex, playerIndex + groupSize);
        
        // Round robin within this group
        for (let i = 0; i < groupPlayers.length; i++) {
            for (let j = i + 1; j < groupPlayers.length; j++) {
                matches.push({
                    tournament_id: tournamentId,
                    player1_id: groupPlayers[i],
                    player2_id: groupPlayers[j],
                    stage: MATCH_STAGE.ROUND_ROBIN,
                    group_name: groupLabels[groupIndex],
                    board_id: `Board ${(boardIndex % numBoards) + 1}`,
                    status: MATCH_STATUS.PENDING
                });
                boardIndex++;
            }
        }
        
        playerIndex += groupSize;
    });
    
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

// Manual Override Functions
function showManualOverrideModal() {
    if (!tournamentState.currentTournament) {
        showError('Please select a tournament first');
        return;
    }
    
    loadManualRankings();
    document.getElementById('manual-override-modal').style.display = 'flex';
}

function closeManualOverrideModal() {
    document.getElementById('manual-override-modal').style.display = 'none';
}

async function loadManualRankings() {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        // Get standings for current tournament
        const { data, error } = await client
            .from('tournament_leaderboard')
            .select('*')
            .eq('tournament_id', tournamentState.currentTournament)
            .order('group_name')
            .order('points', { ascending: false });
        
        if (error) throw error;
        
        // Group by group_name
        const groupedData = {};
        data.forEach(player => {
            if (!groupedData[player.group_name]) {
                groupedData[player.group_name] = [];
            }
            groupedData[player.group_name].push(player);
        });
        
        renderManualRankings(groupedData);
    } catch (error) {
        console.error('Error loading rankings:', error);
        showError('Failed to load rankings');
    }
}

function renderManualRankings(groupedData) {
    const container = document.getElementById('manual-rankings-container');
    if (!container) return;
    
    let html = '';
    Object.keys(groupedData).sort().forEach(groupName => {
        html += `
            <div class="ranking-group" data-group="${groupName}">
                <h3>Group ${groupName}</h3>
                <div class="ranking-list" id="ranking-list-${groupName}">
                    ${groupedData[groupName].map((player, index) => `
                        <div class="ranking-item" draggable="true" data-player-id="${player.player_id}">
                            <div class="ranking-number">${index + 1}</div>
                            <div class="ranking-player">${player.username}</div>
                            <div class="ranking-stats">${player.points}pts | ${player.legs_won}-${player.legs_lost}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    initializeRankingDragDrop();
}

function initializeRankingDragDrop() {
    const items = document.querySelectorAll('.ranking-item');
    let draggedItem = null;
    
    items.forEach(item => {
        item.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
        });
        
        item.addEventListener('dragend', function() {
            setTimeout(() => this.classList.remove('dragging'), 0);
            updateRankingNumbers(this.closest('.ranking-list'));
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const list = this.closest('.ranking-list');
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ranking-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateRankingNumbers(list) {
    const items = list.querySelectorAll('.ranking-item');
    items.forEach((item, index) => {
        const numberEl = item.querySelector('.ranking-number');
        if (numberEl) {
            numberEl.textContent = index + 1;
        }
    });
}

async function saveManualOverride() {
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        // Get all ranking lists
        const groups = document.querySelectorAll('.ranking-group');
        const updates = [];
        
        groups.forEach(group => {
            const groupName = group.dataset.group;
            const items = group.querySelectorAll('.ranking-item');
            
            items.forEach((item, index) => {
                updates.push({
                    tournament_id: tournamentState.currentTournament,
                    player_id: item.dataset.playerId,
                    manual_ranking: index + 1,
                    group_name: groupName
                });
            });
        });
        
        // Save manual rankings (you'll need to add a manual_ranking column to tournament_stats)
        for (const update of updates) {
            const { error } = await client
                .from(TABLES.TOURNAMENT_STATS)
                .update({ manual_ranking: update.manual_ranking })
                .eq('tournament_id', update.tournament_id)
                .eq('player_id', update.player_id);
            
            if (error) throw error;
        }
        
        showSuccess('Rankings updated successfully');
        closeManualOverrideModal();
        loadStandings();
    } catch (error) {
        console.error('Error saving rankings:', error);
        showError('Failed to save rankings');
    }
}

async function finalizeGroupsAndGenerateBracket() {
    if (!confirm('Are you sure you want to finalize group stage and generate the knockout bracket? This cannot be undone.')) {
        return;
    }
    
    // TODO: Implement bracket generation based on group standings and players_advancing setting
    showSuccess('Bracket generation will be implemented next');
}

// Board Management for Tablets
async function showBoardSelection() {
    if (!tournamentState.currentTournament) {
        // Show tournament selection first
        await loadTournamentsForTablet();
        return;
    }
    
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        const { data, error } = await client
            .from(TABLES.BOARDS)
            .select('*')
            .eq('tournament_id', tournamentState.currentTournament)
            .order('board_number');
        
        if (error) throw error;
        
        renderBoardOptions(data || []);
    } catch (error) {
        console.error('Error loading boards:', error);
        showError('Failed to load boards');
    }
}

function renderBoardOptions(boards) {
    const container = document.getElementById('board-options');
    if (!container) return;
    
    container.innerHTML = boards.map(board => `
        <button class="board-option-btn" onclick="selectBoard(${board.board_number})">
            ${board.board_name}
        </button>
    `).join('');
}

async function selectBoard(boardNumber) {
    tournamentState.currentBoard = boardNumber;
    
    const client = getTournamentSupabaseClient();
    if (!client) return;
    
    try {
        // Get board details including connection code
        const { data, error } = await client
            .from(TABLES.BOARDS)
            .select('*')
            .eq('tournament_id', tournamentState.currentTournament)
            .eq('board_number', boardNumber)
            .single();
        
        if (error) throw error;
        
        // Store connection code in session
        sessionStorage.setItem('tournamentBoardCode', data.connection_code);
        
        // Update UI
        document.getElementById('current-board-name').textContent = data.board_name;
        document.getElementById('board-connection-code').textContent = data.connection_code;
        document.getElementById('board-id-display').textContent = data.board_name;
        
        // Hide board selection, show waiting for match
        document.getElementById('board-selection').classList.remove('active');
        document.getElementById('waiting-for-match').classList.add('active');
        
        // Start listening for match assignments
        subscribeToMatchAssignments(boardNumber);
    } catch (error) {
        console.error('Error selecting board:', error);
        showError('Failed to select board');
    }
}

async function subscribeToMatchAssignments(boardNumber) {
    // TODO: Implement real-time subscription to match assignments for this board
    console.log('Subscribed to match assignments for board', boardNumber);
}

async function loadTournamentsForTablet() {
    // TODO: Show tournament selection modal for tablets
    console.log('Loading tournaments for tablet selection');
}

