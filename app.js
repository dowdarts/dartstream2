// Game State
const gameState = {
    currentScreen: 'player-selection-screen',
    gameMode: null,
    players: {
        player1: { 
            name: 'Home', 
            score: 501, 
            preTurnScore: 501, // Score before current turn started
            darts: 0, 
            legDarts: 0, // Darts thrown in current leg
            matchDarts: 0, // Total darts in match
            legScore: 0, // Points scored in current leg
            matchScore: 0, // Total points in match
            legWins: 0, 
            setWins: 0, 
            matchAvg: 0, 
            legAvg: 0,
            turnHistory: [] // Track all turns for undo
        },
        player2: { 
            name: 'Away', 
            score: 501, 
            preTurnScore: 501,
            darts: 0, 
            legDarts: 0,
            matchDarts: 0,
            legScore: 0,
            matchScore: 0,
            legWins: 0, 
            setWins: 0, 
            matchAvg: 0, 
            legAvg: 0,
            turnHistory: []
        }
    },
    currentPlayer: 2, // 1 or 2
    currentVisit: [],
    currentInput: '', // Track digits being entered
    dartScores: [], // Track individual dart scores in current turn (for calculator mode)
    dartsThrown: 0, // Darts thrown in current turn (0-3)
    turnTotal: 0, // Accumulated score for current turn
    visitNumber: 1,
    currentSet: 1,
    currentLeg: 1,
    legStarter: null, // Track who started the current leg (1 or 2)
    setStarter: null, // Track who started the first leg of current set (1 or 2)
    isChangingPlayers: false, // Flag for when changing players mid-match
    isChangingGame: false, // Flag for when changing game type mid-match
    isEditingSettings: false, // Flag for when editing match settings mid-match
    matchSettings: {
        gameType: '501',
        startScore: 501,
        startType: 'SIDO', // SIDO, DIDO, SISO, DISO
        legsFormat: 'best-of', // 'best-of' or 'play-all'
        totalLegs: 3,
        legsToWin: 2,
        setsFormat: 'best-of', // 'best-of' or 'play-all'
        totalSets: 1,
        setsToWin: 1,
        playerStartFormat: 'alternate', // 'alternate' or 'bull-up'
        randomMatchStart: false, // random 50/50 for first leg
        bullFirstLeg: true, // user selects first leg starter
        bullLastLeg: false, // bull up on last leg
        gameTypeChangeFrequency: 'per-match', // 'every-leg', 'per-set', 'per-match'
        legSelectionBeforeSet: false,
        firstLegStarter: null, // player 1 or 2
        needsBullUp: false // track if we need bull up for next leg
    },
    playerLibrary: []
};

// Initialize default player library
async function initializePlayerLibrary() {
    console.log('Starting player library initialization...');
    
    // First, try to load from localStorage for instant display
    const cachedPlayers = localStorage.getItem('playerLibrary');
    if (cachedPlayers) {
        try {
            gameState.playerLibrary = JSON.parse(cachedPlayers);
            console.log('Loaded players from localStorage:', gameState.playerLibrary.length);
        } catch (error) {
            console.error('Error parsing cached players:', error);
            gameState.playerLibrary = [];
        }
    }
    
    // Then sync with Supabase in the background
    try {
        console.log('Fetching players from Supabase...');
        const players = await PlayerDB.getAllPlayers();
        console.log('Players fetched from Supabase:', players);
        
        if (players.length > 0) {
            gameState.playerLibrary = players;
            // Save to localStorage
            localStorage.setItem('playerLibrary', JSON.stringify(players));
            console.log('Synced players with Supabase:', players.length);
        } else {
            console.log('No players in database, adding defaults...');
            // If no players in database, add default players
            const defaultPlayers = [
                { firstName: 'Aubrey', lastName: 'Holland' },
                { firstName: 'Beth', lastName: 'Beniot' },
                { firstName: 'Bill', lastName: 'Ferris' },
                { firstName: 'Cecil', lastName: 'Dow' },
                { firstName: 'Chief', lastName: 'saulnier' },
                { firstName: 'Chris', lastName: 'Ross' },
                { firstName: 'Cindy', lastName: 'Smith' },
                { firstName: 'Connie', lastName: 'Dow' },
                { firstName: 'Corey', lastName: 'Obrien' },
                { firstName: 'Cory', lastName: 'Wallace' },
                { firstName: 'Currie', lastName: 'Matheson' },
                { firstName: 'Dan', lastName: 'B' },
                { firstName: 'Dave', lastName: 'Cormier' },
                { firstName: 'Dave', lastName: 'Pepperdean' },
                { firstName: 'Dawn', lastName: 'Leblanc' },
                { firstName: 'Dee', lastName: 'Cormier' },
                { firstName: 'Denis', lastName: 'Cormier' },
                { firstName: 'Denis', lastName: 'Leblanc' },
                { firstName: 'Don', lastName: ',' },
                { firstName: 'Eddie', lastName: 'Trevors' },
                { firstName: 'Emma', lastName: 'B' },
                { firstName: 'Eugene', lastName: 'I' },
                { firstName: 'Fred', lastName: 'D' },
                { firstName: 'Gerry', lastName: 'Johnston' }
            ];
            
            // Add default players to database
            for (const player of defaultPlayers) {
                try {
                    await PlayerDB.addPlayer(player.firstName, player.lastName);
                } catch (error) {
                    console.error('Error adding default player:', error);
                }
            }
            
            // Reload from database and save to localStorage
            const freshPlayers = await PlayerDB.getAllPlayers();
            gameState.playerLibrary = freshPlayers;
            localStorage.setItem('playerLibrary', JSON.stringify(freshPlayers));
            console.log('Added default players, total:', freshPlayers.length);
        }
    } catch (error) {
        console.error('Error syncing with Supabase:', error);
        // If Supabase fails and we have no cached data, use empty array
        if (!cachedPlayers) {
            gameState.playerLibrary = [];
        }
    }
    
    console.log('Player library initialized. Total players:', gameState.playerLibrary.length);
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Game Mode Selection
document.querySelectorAll('[data-game]').forEach(btn => {
    btn.addEventListener('click', function() {
        const gameType = this.getAttribute('data-game');
        
        if (gameType === 'quick-501') {
            gameState.matchSettings.gameType = '501';
            gameState.matchSettings.startType = 'SIDO';
            gameState.matchSettings.totalLegs = 3;
            gameState.matchSettings.legsToWin = 2;
            gameState.gameMode = 'quick-501'; // Mark as quick mode
            showScreen('player-selection-screen');
            renderPlayerSelectionLists();
        } else if (gameType === 'extended-501') {
            gameState.matchSettings.gameType = '501';
            gameState.matchSettings.startType = 'SIDO';
            gameState.matchSettings.totalLegs = 9;
            gameState.matchSettings.legsToWin = 5;
            gameState.gameMode = 'extended-501'; // Mark as quick mode
            showScreen('player-selection-screen');
            renderPlayerSelectionLists();
        } else if (gameType === 'quick-301') {
            gameState.matchSettings.gameType = '301';
            gameState.matchSettings.startType = 'DIDO';
            gameState.matchSettings.totalLegs = 3;
            gameState.matchSettings.legsToWin = 2;
            gameState.gameMode = 'quick-301'; // Mark as quick mode
            showScreen('player-selection-screen');
            renderPlayerSelectionLists();
        } else if (gameType === 'extended-301') {
            gameState.matchSettings.gameType = '301';
            gameState.matchSettings.startType = 'DIDO';
            gameState.matchSettings.totalLegs = 5;
            gameState.matchSettings.legsToWin = 3;
            gameState.gameMode = 'extended-301'; // Mark as quick mode
            showScreen('player-selection-screen');
            renderPlayerSelectionLists();
        } else if (gameType === 'custom') {
            showModal('match-settings-modal');
        }
    });
});

// Player Library Management
let selectedPlayersForGame = [];
let selectedPlayersForDelete = [];
let libraryMode = 'select'; // 'select', 'edit', 'delete'
let filteringActive = false; // Track if user has opened Manage Library to filter

document.getElementById('manage-library')?.addEventListener('click', function() {
    // Only pre-select all players if filtering hasn't been activated yet
    if (!filteringActive) {
        selectedPlayersForGame = gameState.playerLibrary.map(player => 
            `${player.firstName} ${player.lastName}`
        );
    }
    // If filtering is already active, keep the current selections
    filteringActive = true; // Mark that filtering is now active
    showModal('player-library-modal');
    libraryMode = 'select';
    updateLibraryButtonStates();
    renderPlayerLibrary();
});

// Reset Picks buttons
document.getElementById('reset-picks-left')?.addEventListener('click', function() {
    leftSelectedDisplay.textContent = 'Select player from list below';
    gameState.players.player1.name = 'Home';
    document.getElementById('player1-name-display').textContent = 'Home';
    leftPlayerList.querySelectorAll('.player-item').forEach(item => {
        item.classList.remove('selected');
    });
});

// Back button on player selection screen
document.getElementById('back-to-game-mode')?.addEventListener('click', function() {
    showScreen('game-mode-screen');
    // Reset selections
    selectedPlayersForGame = [];
    gameState.players.player1.name = 'Home';
    gameState.players.player2.name = 'Away';
    document.getElementById('player1-name-display').textContent = 'Home';
    document.getElementById('player2-name-display').textContent = 'Away';
    leftSelectedDisplay.textContent = 'Select player from list below';
    rightSelectedDisplay.textContent = 'Select player from list below';
});

document.getElementById('reset-picks-right')?.addEventListener('click', function() {
    rightSelectedDisplay.textContent = 'Select player from list below';
    gameState.players.player2.name = 'Away';
    document.getElementById('player2-name-display').textContent = 'Away';
    rightPlayerList.querySelectorAll('.player-item').forEach(item => {
        item.classList.remove('selected');
    });
});

function updateLibraryButtonStates() {
    const buttons = document.querySelectorAll('#player-library-modal .lib-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // Get continue button by ID
    const continueButton = document.getElementById('library-continue-btn');
    
    // Safety check - return if button doesn't exist yet
    if (!continueButton) {
        return;
    }
    
    if (libraryMode === 'edit') {
        buttons[2]?.classList.add('selected'); // Edit button
        continueButton.textContent = 'Continue';
        continueButton.className = 'lib-footer-btn green';
    } else if (libraryMode === 'delete') {
        buttons[3]?.classList.add('selected'); // Delete button
        
        // Change Continue button to Delete button if players are selected
        if (selectedPlayersForDelete.length > 0) {
            continueButton.textContent = `Delete (${selectedPlayersForDelete.length})`;
            continueButton.className = 'lib-footer-btn red';
        } else {
            continueButton.textContent = 'Continue';
            continueButton.className = 'lib-footer-btn green';
        }
    } else {
        continueButton.textContent = 'Continue';
        continueButton.className = 'lib-footer-btn green';
    }
}

function renderPlayerLibrary() {
    const grid = document.getElementById('player-grid');
    grid.innerHTML = '';
    
    gameState.playerLibrary.forEach((player) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerId = player.id; // Store player ID
        
        const playerName = `${player.firstName} ${player.lastName}`;
        
        // Check if this player is selected for the game
        const isSelectedForGame = selectedPlayersForGame.includes(playerName);
        if (isSelectedForGame) {
            card.classList.add('selected-for-game');
        }
        
        // Check if this player is selected for deletion
        const isSelectedForDelete = selectedPlayersForDelete.includes(playerName);
        if (isSelectedForDelete) {
            card.classList.add('selected-for-delete');
        }
        
        card.innerHTML = `
            <div class="name">${player.firstName}</div>
            <div class="surname">${player.lastName}</div>
            <div class="player-id">ID: ${player.id}</div>
        `;
        
        card.addEventListener('click', function() {
            handlePlayerCardClick(player, playerName, this);
        });
        
        grid.appendChild(card);
    });
}

function handlePlayerCardClick(player, playerName, cardElement) {
    if (libraryMode === 'select') {
        // Multi-select mode for game
        const indexInSelected = selectedPlayersForGame.indexOf(playerName);
        
        if (indexInSelected > -1) {
            // Deselect
            selectedPlayersForGame.splice(indexInSelected, 1);
            cardElement.classList.remove('selected-for-game');
        } else {
            // Select
            selectedPlayersForGame.push(playerName);
            cardElement.classList.add('selected-for-game');
        }
    } else if (libraryMode === 'edit') {
        // Edit mode - show edit prompt
        const firstName = prompt('Edit first name:', player.firstName);
        if (firstName === null || firstName.trim() === '') return;
        
        const lastName = prompt('Edit last name:', player.lastName);
        if (lastName === null || lastName.trim() === '') return;
        
        updatePlayerInDatabase(player.id, firstName.trim(), lastName.trim());
    } else if (libraryMode === 'delete') {
        // Delete mode - multi-select for deletion
        const indexInDelete = selectedPlayersForDelete.indexOf(playerName);
        
        if (indexInDelete > -1) {
            // Deselect from delete list
            selectedPlayersForDelete.splice(indexInDelete, 1);
            cardElement.classList.remove('selected-for-delete');
        } else {
            // Select for deletion
            selectedPlayersForDelete.push(playerName);
            cardElement.classList.add('selected-for-delete');
        }
        
        // Update button states to reflect selection count
        updateLibraryButtonStates();
    }
}

async function updatePlayerInDatabase(playerId, firstName, lastName) {
    try {
        await PlayerDB.updatePlayer(playerId, firstName, lastName);
        await refreshPlayerLibraryFromDatabase();
        alert('Player updated successfully!');
    } catch (error) {
        console.error('Error updating player:', error);
        alert('Failed to update player. Please try again.');
    }
}

async function refreshPlayerLibraryFromDatabase() {
    try {
        const players = await PlayerDB.getAllPlayers();
        gameState.playerLibrary = players;
        // Update localStorage cache
        localStorage.setItem('playerLibrary', JSON.stringify(players));
        renderPlayerLibrary();
        renderPlayerSelectionLists();
    } catch (error) {
        console.error('Error refreshing player library:', error);
        alert('Failed to refresh player library. Please try again.');
    }
}

// Reset button - deselect all players
document.querySelector('#player-library-modal .lib-btn:nth-child(1)')?.addEventListener('click', function() {
    selectedPlayersForGame = [];
    selectedPlayersForDelete = [];
    filteringActive = false; // Reset filtering when reset is clicked
    renderPlayerLibrary();
});

// New button - add new player
document.querySelector('#player-library-modal .lib-btn:nth-child(2)')?.addEventListener('click', function() {
    showModal('add-player-modal');
    document.getElementById('new-player-firstname').value = '';
    document.getElementById('new-player-lastname').value = '';
    
    // Delay focus to ensure modal is visible and trigger mobile keyboard
    setTimeout(() => {
        document.getElementById('new-player-firstname').focus();
    }, 100);
});

// Add Player Modal - Submit
document.getElementById('add-player-submit')?.addEventListener('click', async function() {
    const firstName = document.getElementById('new-player-firstname').value.trim();
    const lastName = document.getElementById('new-player-lastname').value.trim();
    
    if (firstName === '' || lastName === '') {
        alert('Please enter both first and last name');
        return;
    }
    
    try {
        await PlayerDB.addPlayer(firstName, lastName);
        await refreshPlayerLibraryFromDatabase();
        hideModal('add-player-modal');
        // Clear input fields
        document.getElementById('new-player-firstname').value = '';
        document.getElementById('new-player-lastname').value = '';
        alert('Player added successfully!');
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player. Please try again.');
    }
});

// Add Player Modal - Cancel
document.getElementById('add-player-cancel')?.addEventListener('click', function() {
    hideModal('add-player-modal');
});

// Add Player Modal - Close X
document.getElementById('close-add-player')?.addEventListener('click', function() {
    hideModal('add-player-modal');
});

// Edit button - enter edit mode
document.querySelector('#player-library-modal .lib-btn:nth-child(3)')?.addEventListener('click', function() {
    if (libraryMode === 'edit') {
        // Deactivate edit mode
        libraryMode = 'select';
        updateLibraryButtonStates();
    } else {
        // Activate edit mode
        libraryMode = 'edit';
        updateLibraryButtonStates();
    }
});

// Delete button - toggle delete mode
document.querySelector('#player-library-modal .lib-btn:nth-child(4)')?.addEventListener('click', function() {
    if (libraryMode === 'delete') {
        // Deactivate delete mode
        selectedPlayersForDelete = [];
        libraryMode = 'select';
        updateLibraryButtonStates();
        renderPlayerLibrary();
    } else {
        // Activate delete mode
        selectedPlayersForDelete = [];
        libraryMode = 'delete';
        updateLibraryButtonStates();
    }
});

// Continue button - apply selections and close modal OR delete in delete mode
document.getElementById('library-continue-btn')?.addEventListener('click', async function() {
    if (libraryMode === 'delete' && selectedPlayersForDelete.length > 0) {
        // In delete mode with selections - perform deletion
        const confirmDelete = confirm(`Delete ${selectedPlayersForDelete.length} player(s)?`);
        
        if (confirmDelete) {
            try {
                console.log('Selected players for delete:', selectedPlayersForDelete);
                console.log('Current player library:', gameState.playerLibrary);
                
                // Get player IDs for deletion
                const playerIdsToDelete = selectedPlayersForDelete.map(playerName => {
                    const player = gameState.playerLibrary.find(p => 
                        `${p.firstName} ${p.lastName}` === playerName
                    );
                    console.log(`Finding player "${playerName}":`, player);
                    return player?.id;
                }).filter(id => id !== undefined);
                
                console.log('Player IDs to delete:', playerIdsToDelete);
                
                if (playerIdsToDelete.length > 0) {
                    await PlayerDB.deletePlayers(playerIdsToDelete);
                    
                    // Remove from game selection if present
                    selectedPlayersForDelete.forEach(playerName => {
                        const gameIndex = selectedPlayersForGame.indexOf(playerName);
                        if (gameIndex > -1) {
                            selectedPlayersForGame.splice(gameIndex, 1);
                        }
                    });
                    
                    selectedPlayersForDelete = [];
                    libraryMode = 'select';
                    await refreshPlayerLibraryFromDatabase();
                    updateLibraryButtonStates();
                    alert('Players deleted successfully!');
                } else {
                    console.error('No valid player IDs found for deletion');
                    alert('Could not find player IDs for deletion');
                }
            } catch (error) {
                console.error('Error deleting players:', error);
                alert('Failed to delete players. Please try again.');
            }
        }
    } else {
        // Normal continue - apply selected players to the player selection lists
        // Re-render the player selection lists with the filter applied
        renderPlayerSelectionLists();
        
        hideModal('player-library-modal');
        libraryMode = 'select';
        selectedPlayersForDelete = [];
    }
});

// Backup Library button - no function for now
document.querySelector('#player-library-modal .lib-footer-btn:nth-child(1)')?.addEventListener('click', function() {
    alert('Backup function will be implemented later');
});

// Download Library button - no function for now
document.querySelector('#player-library-modal .lib-footer-btn.gold')?.addEventListener('click', function() {
    alert('Download function will be implemented later');
});

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Match Settings
document.querySelectorAll('.setting-option').forEach(btn => {
    btn.addEventListener('click', function() {
        const parent = this.parentElement;
        parent.querySelectorAll('.setting-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
    });
});

document.querySelector('#match-settings-modal .continue-btn').addEventListener('click', function() {
    hideModal('match-settings-modal');
    showScreen('player-selection-screen');
    renderPlayerSelectionLists();
});

// Advanced Settings
document.querySelector('.settings-btn.gold').addEventListener('click', function() {
    hideModal('match-settings-modal');
    showModal('advanced-settings-modal');
});

document.querySelector('#advanced-settings-modal .continue-btn.green').addEventListener('click', function() {
    hideModal('advanced-settings-modal');
    showScreen('player-selection-screen');
    renderPlayerSelectionLists();
});

// Player Selection
const leftPlayerList = document.getElementById('left-player-list');
const rightPlayerList = document.getElementById('right-player-list');
const leftSelectedDisplay = document.getElementById('left-selected-display');
const rightSelectedDisplay = document.getElementById('right-selected-display');

function renderPlayerSelectionLists() {
    // Render left player list - show all players or only selected ones if filtered
    leftPlayerList.innerHTML = '';
    
    // Determine which players to show
    let playersToShow;
    if (!filteringActive) {
        // No filtering applied - show all players
        playersToShow = gameState.playerLibrary;
    } else {
        // Filtering is active - show only selected players (even if empty array)
        playersToShow = gameState.playerLibrary.filter(player => {
            const playerName = `${player.firstName} ${player.lastName}`;
            return selectedPlayersForGame.includes(playerName);
        });
    }
    
    playersToShow.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        const playerName = `${player.firstName} ${player.lastName}`;
        
        // Disable if player is selected on the right side
        if (gameState.players.player2.name === playerName) {
            playerItem.classList.add('disabled');
            playerItem.style.opacity = '0.4';
            playerItem.style.pointerEvents = 'none';
        }
        
        // Highlight if this is the selected left player
        if (gameState.players.player1.name === playerName) {
            playerItem.classList.add('selected');
        }
        
        playerItem.innerHTML = `<span>${playerName}</span>`;
        playerItem.addEventListener('click', function() {
            selectPlayer(player, 'left');
        });
        leftPlayerList.appendChild(playerItem);
    });
    
    // Render right player list - show all players or only selected ones if filtered
    rightPlayerList.innerHTML = '';
    
    playersToShow.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        const playerName = `${player.firstName} ${player.lastName}`;
        
        // Disable if player is selected on the left side
        if (gameState.players.player1.name === playerName) {
            playerItem.classList.add('disabled');
            playerItem.style.opacity = '0.4';
            playerItem.style.pointerEvents = 'none';
        }
        
        // Highlight if this is the selected right player
        if (gameState.players.player2.name === playerName) {
            playerItem.classList.add('selected');
        }
        
        playerItem.innerHTML = `<span>${playerName}</span>`;
        playerItem.addEventListener('click', function() {
            selectPlayer(player, 'right');
        });
        rightPlayerList.appendChild(playerItem);
    });
}

function selectPlayer(player, side) {
    const playerName = `${player.firstName} ${player.lastName}`;
    
    if (side === 'left') {
        // Check if this player is already selected on the right side
        if (gameState.players.player2.name === playerName) {
            alert('This player is already selected as the Right Opponent. Please choose a different player.');
            return;
        }
        
        gameState.players.player1.name = playerName;
        leftSelectedDisplay.textContent = playerName;
        document.getElementById('player1-name-display').textContent = playerName;
        
        // Re-render both lists to update disabled states and selections
        renderPlayerSelectionLists();
    } else {
        // Check if this player is already selected on the left side
        if (gameState.players.player1.name === playerName) {
            alert('This player is already selected as the Left Opponent. Please choose a different player.');
            return;
        }
        
        gameState.players.player2.name = playerName;
        rightSelectedDisplay.textContent = playerName;
        document.getElementById('player2-name-display').textContent = playerName;
        
        // Re-render both lists to update disabled states and selections
        renderPlayerSelectionLists();
    }
}

// Select Players button
document.getElementById('select-players-btn')?.addEventListener('click', function() {
    showScreen('game-selection-screen');
});

// Start Game button (same function as Select Players)
document.getElementById('start-game-btn')?.addEventListener('click', function() {
    // If a quick mode was selected, skip game selection and go straight to starting player
    if (gameState.gameMode === 'quick-501' || gameState.gameMode === 'extended-501' || 
        gameState.gameMode === 'quick-301' || gameState.gameMode === 'extended-301') {
        showScreen('starting-player-screen');
        updateStartingPlayerScreen();
    } else {
        // For custom mode, show game selection
        showScreen('game-selection-screen');
    }
});

// Game Selection
document.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', function() {
        const type = this.getAttribute('data-type');
        gameState.matchSettings.gameType = type;
        
        if (type === '301') {
            gameState.matchSettings.startType = 'DIDO';
            gameState.matchSettings.startScore = 301;
        } else if (type === '501') {
            gameState.matchSettings.startType = 'SIDO';
            gameState.matchSettings.startScore = 501;
        }
        
        showScreen('starting-player-screen');
        updateStartingPlayerScreen();
    });
});

function updateStartingPlayerScreen() {
    // Update button text
    document.getElementById('start-player1').textContent = gameState.players.player1.name;
    document.getElementById('start-player2').textContent = gameState.players.player2.name;
    
    // Update header player names at top
    document.getElementById('starting-player1-name-top').textContent = gameState.players.player1.name;
    document.getElementById('starting-player2-name-top').textContent = gameState.players.player2.name;
    
    // Update scores based on game type
    const startScore = gameState.matchSettings.startScore || 501;
    gameState.players.player1.score = startScore;
    gameState.players.player2.score = startScore;
    
    // Update score displays at top
    document.getElementById('starting-player1-score-top').textContent = startScore;
    document.getElementById('starting-player2-score-top').textContent = startScore;
    
    // Update game format display
    updateGameFormatDisplay();
    updateLegsFormatDisplay();
}

function updateGameFormatDisplay() {
    const score = gameState.matchSettings.startScore || 501;
    const startType = gameState.matchSettings.startType || 'SIDO';
    const formatText = `${score} ${startType}`;
    document.getElementById('game-format-btn').textContent = formatText;
}

function updateLegsFormatDisplay() {
    const settings = gameState.matchSettings;
    let formatText = '';
    
    // Show set information if more than 1 set
    if (settings.totalSets > 1) {
        const setFormat = settings.setsFormat === 'best-of' ? 'Best of' : 'Play All';
        const legFormat = settings.legsFormat === 'best-of' ? 'Best of' : 'Play All';
        formatText = `${setFormat} ${settings.totalSets} Sets, ${legFormat} ${settings.totalLegs} Legs`;
    } else {
        // Single set - just show legs
        if (settings.legsFormat === 'play-all') {
            formatText = `Play All ${settings.totalLegs} Legs`;
        } else if (settings.legsFormat === 'best-of') {
            formatText = `Best of ${settings.totalLegs} Legs`;
        } else if (settings.legsFormat === 'play-every') {
            formatText = `Play Every Leg - ${settings.totalLegs} Legs`;
        } else {
            formatText = `First to ${settings.legsToWin} Legs`;
        }
    }
    
    document.getElementById('legs-format-btn').textContent = formatText;
}

// Starting Player Selection
document.getElementById('start-player1').addEventListener('click', function() {
    gameState.currentPlayer = 1;
    gameState.legStarter = 1; // Track that player 1 started this leg
    
    // Track first leg starter if not set
    if (gameState.matchSettings.firstLegStarter === null) {
        gameState.matchSettings.firstLegStarter = 1;
    }
    
    // Highlight player 1's score box
    document.querySelector('.player-header.left').classList.add('active');
    document.querySelector('.player-header.right').classList.remove('active');
    startGame();
});

document.getElementById('start-player2').addEventListener('click', function() {
    gameState.currentPlayer = 2;
    gameState.legStarter = 2; // Track that player 2 started this leg
    
    // Track first leg starter if not set
    if (gameState.matchSettings.firstLegStarter === null) {
        gameState.matchSettings.firstLegStarter = 2;
    }
    
    // Highlight player 2's score box
    document.querySelector('.player-header.right').classList.add('active');
    document.querySelector('.player-header.left').classList.remove('active');
    startGame();
});

// Coin Toss Button
// Coin Toss Button - just show heads or tails result
document.getElementById('coin-toss-btn').addEventListener('click', function() {
    const coinResult = Math.random() > 0.5 ? 'heads' : 'tails';
    
    // Show result only (players still choose who starts)
    const resultText = `${coinResult.toUpperCase()}`;
    document.getElementById('coin-result-text').textContent = resultText;
    document.getElementById('coin-result-display').style.display = 'flex';
    
    // Hide result after 3 seconds
    setTimeout(() => {
        document.getElementById('coin-result-display').style.display = 'none';
    }, 3000);
});

// Random Button
document.getElementById('random-btn').addEventListener('click', function() {
    gameState.currentPlayer = Math.random() > 0.5 ? 1 : 2;
    
    // Track first leg starter if not set (or if changing players mid-match)
    if (gameState.matchSettings.firstLegStarter === null || gameState.isChangingPlayers) {
        gameState.matchSettings.firstLegStarter = gameState.currentPlayer;
        gameState.legStarter = gameState.currentPlayer;
        if (!gameState.isChangingPlayers) {
            gameState.setStarter = gameState.currentPlayer;
        }
    }
    
    // Show result
    const resultText = `${gameState.currentPlayer === 1 ? gameState.players.player1.name : gameState.players.player2.name} starts!`;
    document.getElementById('coin-result-text').textContent = resultText;
    document.getElementById('coin-result-display').style.display = 'flex';
    
    // Hide result after 3 seconds and start game
    setTimeout(() => {
        document.getElementById('coin-result-display').style.display = 'none';
        if (gameState.currentPlayer === 1) {
            document.querySelector('.player-header.left').classList.add('active');
            document.querySelector('.player-header.right').classList.remove('active');
        } else {
            document.querySelector('.player-header.right').classList.add('active');
            document.querySelector('.player-header.left').classList.remove('active');
        }
        startGame();
    }, 3000);
});

// Skip Button - Go back to game type selection
document.getElementById('skip-btn').addEventListener('click', function() {
    showScreen('game-type-select-screen');
});

// Game Type Quick Selection
document.getElementById('select-301-game').addEventListener('click', function() {
    gameState.matchSettings.gameType = '301';
    gameState.matchSettings.startType = 'DIDO';
    gameState.matchSettings.startScore = 301;
    
    // If changing game mid-match, update scores and continue
    if (gameState.isChangingGame) {
        updateGameAfterChange();
    } else {
        showScreen('starting-player-screen');
        updateStartingPlayerScreen();
    }
});

document.getElementById('select-501-game').addEventListener('click', function() {
    gameState.matchSettings.gameType = '501';
    gameState.matchSettings.startType = 'SIDO';
    gameState.matchSettings.startScore = 501;
    
    // If changing game mid-match, update scores and continue
    if (gameState.isChangingGame) {
        updateGameAfterChange();
    } else {
        showScreen('starting-player-screen');
        updateStartingPlayerScreen();
    }
});

document.getElementById('select-custom-game').addEventListener('click', function() {
    // Reset to DIDO defaults (for 301)
    document.getElementById('start-type-di').classList.add('selected');
    document.getElementById('start-type-si').classList.remove('selected');
    document.getElementById('finish-type-do').classList.add('selected');
    document.getElementById('finish-type-so').classList.remove('selected');
    
    showScreen('custom-game-screen');
});

document.getElementById('back-from-game-type').addEventListener('click', function() {
    showScreen('starting-player-screen');
});

// Game format button - opens game type selector
document.getElementById('game-format-btn').addEventListener('click', function() {
    showScreen('game-type-select-screen');
});

// Legs format button - opens match settings
document.getElementById('legs-format-btn').addEventListener('click', function() {
    showScreen('match-settings-screen');
});

// Match Settings Handlers
document.getElementById('advanced-settings-btn').addEventListener('click', function() {
    document.getElementById('simple-settings').style.display = 'none';
    document.getElementById('advanced-settings').style.display = 'block';
    
    // Set input values from current settings
    document.getElementById('sets-count-input').value = gameState.matchSettings.totalSets || 1;
    document.getElementById('legs-count-input').value = gameState.matchSettings.totalLegs || 5;
});

// Simple settings - Best of / First to leg selection
document.querySelectorAll('.settings-btn[data-legs]').forEach(btn => {
    btn.addEventListener('click', function() {
        const legs = parseInt(this.dataset.legs);
        const isFirstTo = this.classList.contains('first-to');
        const isPlayAll = this.classList.contains('play-all');
        
        if (isPlayAll) {
            // Play All X legs
            gameState.matchSettings.totalLegs = legs;
            gameState.matchSettings.legsToWin = legs; // Must play all legs
            gameState.matchSettings.legsFormat = 'play-all';
            
            // Update UI - deselect all other buttons
            document.querySelectorAll('.settings-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
        } else if (isFirstTo) {
            // First to X wins
            gameState.matchSettings.legsToWin = legs;
            gameState.matchSettings.totalLegs = (legs * 2) - 1; // Best of format
            gameState.matchSettings.legsFormat = 'best-of';
            
            // Update UI
            document.querySelectorAll('.settings-btn.first-to').forEach(b => b.classList.remove('selected'));
            document.querySelectorAll('.settings-btn.play-all').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            // Also select corresponding best-of button
            const bestOfValue = (legs * 2) - 1;
            document.querySelectorAll('.settings-btn:not(.first-to):not(.play-all)').forEach(b => {
                if (parseInt(b.dataset.legs) === bestOfValue) {
                    b.classList.add('selected');
                } else {
                    b.classList.remove('selected');
                }
            });
        } else {
            // Best of X legs
            gameState.matchSettings.totalLegs = legs;
            gameState.matchSettings.legsToWin = Math.ceil(legs / 2);
            gameState.matchSettings.legsFormat = 'best-of';
            
            // Update UI
            document.querySelectorAll('.settings-btn:not(.first-to):not(.play-all)').forEach(b => b.classList.remove('selected'));
            document.querySelectorAll('.settings-btn.play-all').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            // Also select corresponding first-to button
            const firstToValue = Math.ceil(legs / 2);
            document.querySelectorAll('.settings-btn.first-to').forEach(b => {
                if (parseInt(b.dataset.legs) === firstToValue) {
                    b.classList.add('selected');
                } else {
                    b.classList.remove('selected');
                }
            });
        }
    });
});

document.getElementById('simple-continue-btn').addEventListener('click', function() {
    showScreen('starting-player-screen');
    updateStartingPlayerScreen();
});

// Advanced Settings - Set Format
document.getElementById('sets-best-of').addEventListener('click', function() {
    const setsCount = parseInt(document.getElementById('sets-count-input').value) || 1;
    gameState.matchSettings.setsFormat = 'best-of';
    gameState.matchSettings.totalSets = setsCount;
    gameState.matchSettings.setsToWin = Math.ceil(setsCount / 2);
    
    this.classList.add('selected');
    document.getElementById('sets-play-all').classList.remove('selected');
});

document.getElementById('sets-play-all').addEventListener('click', function() {
    const setsCount = parseInt(document.getElementById('sets-count-input').value) || 1;
    gameState.matchSettings.setsFormat = 'play-all';
    gameState.matchSettings.totalSets = setsCount;
    gameState.matchSettings.setsToWin = setsCount; // Must play all sets
    
    this.classList.add('selected');
    document.getElementById('sets-best-of').classList.remove('selected');
});

// Update sets when input changes
document.getElementById('sets-count-input').addEventListener('input', function() {
    const setsCount = parseInt(this.value) || 1;
    const format = gameState.matchSettings.setsFormat;
    
    gameState.matchSettings.totalSets = setsCount;
    if (format === 'best-of') {
        gameState.matchSettings.setsToWin = Math.ceil(setsCount / 2);
    } else {
        gameState.matchSettings.setsToWin = setsCount;
    }
});

// Advanced Settings - Legs Format
document.getElementById('legs-best-of').addEventListener('click', function() {
    const legsCount = parseInt(document.getElementById('legs-count-input').value) || 5;
    gameState.matchSettings.legsFormat = 'best-of';
    gameState.matchSettings.totalLegs = legsCount;
    gameState.matchSettings.legsToWin = Math.ceil(legsCount / 2);
    
    this.classList.add('selected');
    document.getElementById('legs-play-all').classList.remove('selected');
});

document.getElementById('legs-play-all').addEventListener('click', function() {
    const legsCount = parseInt(document.getElementById('legs-count-input').value) || 5;
    gameState.matchSettings.legsFormat = 'play-all';
    gameState.matchSettings.totalLegs = legsCount;
    gameState.matchSettings.legsToWin = legsCount; // Must play all legs
    
    this.classList.add('selected');
    document.getElementById('legs-best-of').classList.remove('selected');
});

// Update legs when input changes
document.getElementById('legs-count-input').addEventListener('input', function() {
    const legsCount = parseInt(this.value) || 5;
    const format = gameState.matchSettings.legsFormat;
    
    gameState.matchSettings.totalLegs = legsCount;
    if (format === 'best-of') {
        gameState.matchSettings.legsToWin = Math.ceil(legsCount / 2);
    } else {
        gameState.matchSettings.legsToWin = legsCount;
    }
});
document.getElementById('game-type-every-leg').addEventListener('click', function() {
    gameState.matchSettings.gameTypeChangeFrequency = 'every-leg';
    document.getElementById('game-type-every-leg').classList.add('selected');
    document.getElementById('game-type-per-set').classList.remove('selected');
    document.getElementById('game-type-per-match').classList.remove('selected');
});

document.getElementById('game-type-per-set').addEventListener('click', function() {
    gameState.matchSettings.gameTypeChangeFrequency = 'per-set';
    document.getElementById('game-type-per-set').classList.add('selected');
    document.getElementById('game-type-every-leg').classList.remove('selected');
    document.getElementById('game-type-per-match').classList.remove('selected');
});

document.getElementById('game-type-per-match').addEventListener('click', function() {
    gameState.matchSettings.gameTypeChangeFrequency = 'per-match';
    document.getElementById('game-type-per-match').classList.add('selected');
    document.getElementById('game-type-every-leg').classList.remove('selected');
    document.getElementById('game-type-per-set').classList.remove('selected');
});

// Advanced Settings - Player Start Format
document.getElementById('start-alternate').addEventListener('click', function() {
    gameState.matchSettings.playerStartFormat = 'alternate';
    this.classList.add('selected');
    document.getElementById('start-bull-up').classList.remove('selected');
    document.getElementById('alternate-options').style.display = 'flex';
    document.getElementById('bull-up-options').style.display = 'none';
});

document.getElementById('start-bull-up').addEventListener('click', function() {
    gameState.matchSettings.playerStartFormat = 'bull-up';
    this.classList.add('selected');
    document.getElementById('start-alternate').classList.remove('selected');
    document.getElementById('bull-up-options').style.display = 'flex';
    document.getElementById('alternate-options').style.display = 'none';
});

// Alternate options - can select multiple
document.getElementById('start-random').addEventListener('click', function() {
    gameState.matchSettings.randomMatchStart = !gameState.matchSettings.randomMatchStart;
    this.classList.toggle('selected');
});

document.getElementById('start-bull-first').addEventListener('click', function() {
    gameState.matchSettings.bullFirstLeg = !gameState.matchSettings.bullFirstLeg;
    this.classList.toggle('selected');
});

document.getElementById('start-bull-last').addEventListener('click', function() {
    gameState.matchSettings.bullLastLeg = !gameState.matchSettings.bullLastLeg;
    this.classList.toggle('selected');
});

document.getElementById('advanced-continue-btn').addEventListener('click', function() {
    showScreen('starting-player-screen');
    updateStartingPlayerScreen();
});

document.getElementById('reset-settings-btn').addEventListener('click', function() {
    // Reset to defaults
    gameState.matchSettings.totalLegs = 3;
    gameState.matchSettings.legsToWin = 2;
    gameState.matchSettings.legsFormat = 'best-of';
    gameState.matchSettings.setsFormat = 'best-of';
    gameState.matchSettings.totalSets = 1;
    gameState.matchSettings.setsToWin = 1;
    gameState.matchSettings.playerStartFormat = 'alternate';
    gameState.matchSettings.randomMatchStart = false;
    gameState.matchSettings.bullFirstLeg = true;
    gameState.matchSettings.bullLastLeg = false;
    gameState.matchSettings.gameTypeChangeFrequency = 'per-match';
    gameState.matchSettings.legSelectionBeforeSet = false;
    
    // Reset UI
    document.getElementById('simple-settings').style.display = 'block';
    document.getElementById('advanced-settings').style.display = 'none';
    
    // Reset input values
    document.getElementById('sets-count-input').value = 1;
    document.getElementById('legs-count-input').value = 5;
    
    // Reset button states
    document.getElementById('start-alternate').classList.add('selected');
    document.getElementById('start-bull-up').classList.remove('selected');
    document.getElementById('start-random').classList.remove('selected');
    document.getElementById('start-bull-first').classList.add('selected');
    document.getElementById('start-bull-last').classList.remove('selected');
    document.getElementById('alternate-options').style.display = 'flex';
    document.getElementById('bull-up-options').style.display = 'none';
    
    updateStartingPlayerScreen();
});

// Start Type option buttons (SI/DI)
document.getElementById('start-type-si').addEventListener('click', function() {
    document.getElementById('start-type-si').classList.add('selected');
    document.getElementById('start-type-di').classList.remove('selected');
});

document.getElementById('start-type-di').addEventListener('click', function() {
    document.getElementById('start-type-di').classList.add('selected');
    document.getElementById('start-type-si').classList.remove('selected');
});

// Finish Type option buttons (SO/DO)
document.getElementById('finish-type-so').addEventListener('click', function() {
    document.getElementById('finish-type-so').classList.add('selected');
    document.getElementById('finish-type-do').classList.remove('selected');
});

document.getElementById('finish-type-do').addEventListener('click', function() {
    document.getElementById('finish-type-do').classList.add('selected');
    document.getElementById('finish-type-so').classList.remove('selected');
});

// Custom game selection
document.querySelector('[data-game="custom"]').addEventListener('click', function() {
    showScreen('custom-game-screen');
});

document.querySelectorAll('[data-custom]').forEach(btn => {
    btn.addEventListener('click', function() {
        const customScore = parseInt(this.dataset.custom);
        
        // For 301, automatically set to DIDO (Double In Double Out)
        if (customScore === 301) {
            // Set Double In
            document.getElementById('start-type-di').classList.add('selected');
            document.getElementById('start-type-si').classList.remove('selected');
            
            // Set Double Out (already default)
            document.getElementById('finish-type-do').classList.add('selected');
            document.getElementById('finish-type-so').classList.remove('selected');
            
            gameState.matchSettings.gameType = '301';
            gameState.matchSettings.startScore = 301;
            gameState.matchSettings.startType = 'DIDO';
        } else {
            // For other scores, use selected options
            const startIn = document.getElementById('start-type-si').classList.contains('selected');
            const doubleIn = document.getElementById('start-type-di').classList.contains('selected');
            const startTypePrefix = startIn ? 'SI' : 'DI';
            
            const straightOut = document.getElementById('finish-type-so').classList.contains('selected');
            const doubleOut = document.getElementById('finish-type-do').classList.contains('selected');
            const finishTypeSuffix = straightOut ? 'SO' : 'DO';
            
            const startType = startTypePrefix + finishTypeSuffix;
            
            gameState.matchSettings.gameType = customScore.toString();
            gameState.matchSettings.startScore = customScore;
            gameState.matchSettings.startType = startType;
        }
        
        gameState.matchSettings.format = 'Best of 3 legs';
        showScreen('starting-player-screen');
        updateStartingPlayerScreen();
    });
});

document.getElementById('back-from-custom').addEventListener('click', function() {
    showScreen('game-type-select-screen');
});

// Custom Game link from player selection screen
document.getElementById('custom-game-link').addEventListener('click', function() {
    // Reset to DIDO defaults (for 301)
    document.getElementById('start-type-di').classList.add('selected');
    document.getElementById('start-type-si').classList.remove('selected');
    document.getElementById('finish-type-do').classList.add('selected');
    document.getElementById('finish-type-so').classList.remove('selected');
    
    showScreen('custom-game-screen');
});

// Back to Players button on game screen - with confirmation
document.getElementById('back-to-players').addEventListener('click', function() {
    const confirmed = confirm('Are you sure you want to return to main menu? All game progress will be lost.');
    if (confirmed) {
        // Reset all game state
        const startScore = gameState.matchSettings.startScore || 501;
        
        // Reset both players completely
        gameState.players.player1.score = startScore;
        gameState.players.player1.preTurnScore = startScore;
        gameState.players.player1.darts = 0;
        gameState.players.player1.legDarts = 0;
        gameState.players.player1.matchDarts = 0;
        gameState.players.player1.legScore = 0;
        gameState.players.player1.matchScore = 0;
        gameState.players.player1.legAvg = 0;
        gameState.players.player1.matchAvg = 0;
        gameState.players.player1.legWins = 0;
        gameState.players.player1.setWins = 0;
        gameState.players.player1.turnHistory = [];
        
        gameState.players.player2.score = startScore;
        gameState.players.player2.preTurnScore = startScore;
        gameState.players.player2.darts = 0;
        gameState.players.player2.legDarts = 0;
        gameState.players.player2.matchDarts = 0;
        gameState.players.player2.legScore = 0;
        gameState.players.player2.matchScore = 0;
        gameState.players.player2.legAvg = 0;
        gameState.players.player2.matchAvg = 0;
        gameState.players.player2.legWins = 0;
        gameState.players.player2.setWins = 0;
        gameState.players.player2.turnHistory = [];
        
        // Reset game counters
        gameState.currentVisit = [];
        gameState.visitNumber = 1;
        gameState.currentSet = 1;
        gameState.currentLeg = 1;
        gameState.dartsThrown = 0;
        gameState.turnTotal = 0;
        gameState.currentInput = '';
        gameState.dartScores = [];
        gameState.legStarter = null;
        
        // Update all score displays on player selection screen
        const playerSelectSetScore = document.getElementById('player-select-set-score');
        const playerSelectLegScore = document.getElementById('player-select-leg-score');
        const playerSelectSetScoreBig = document.getElementById('player-select-set-score-big');
        
        if (playerSelectSetScore) {
            playerSelectSetScore.textContent = '0 - 0';
        }
        if (playerSelectLegScore) {
            playerSelectLegScore.textContent = '0 - 0';
        }
        if (playerSelectSetScoreBig) {
            playerSelectSetScoreBig.textContent = '0 - 0';
        }
        
        showScreen('player-selection-screen');
    }
});

// Connect button (no function for now)
document.getElementById('connect-btn').addEventListener('click', function() {
    // Will be used later to connect to TV scoreboard
    console.log('Connect button clicked - functionality to be implemented');
});


// Start Game
function startGame() {
    // Check if this is a mid-match change
    if (gameState.isChangingPlayers) {
        // Keep match scores, just reset leg scores
        const startScore = gameState.matchSettings.startScore || 501;
        
        gameState.players.player1.score = startScore;
        gameState.players.player1.preTurnScore = startScore;
        gameState.players.player1.legDarts = 0;
        gameState.players.player1.legScore = 0;
        gameState.players.player1.legAvg = 0;
        gameState.players.player1.turnHistory = [];
        
        gameState.players.player2.score = startScore;
        gameState.players.player2.preTurnScore = startScore;
        gameState.players.player2.legDarts = 0;
        gameState.players.player2.legScore = 0;
        gameState.players.player2.legAvg = 0;
        gameState.players.player2.turnHistory = [];
        
        gameState.currentVisit = [];
        gameState.dartScores = [];
        gameState.currentInput = '';
        gameState.turnTotal = 0;
        
        // Reset player change flag
        gameState.isChangingPlayers = false;
        
        // Continue with next set
        showScreen('game-screen');
        updateGameScreen();
        updateActionButtonText();
        return;
    }
    
    // Reset game state for new game
    const startScore = gameState.matchSettings.gameType === '301' ? 301 : 
                       gameState.matchSettings.startScore || 501;
    
    // Reset both players
    gameState.players.player1.score = startScore;
    gameState.players.player1.preTurnScore = startScore;
    gameState.players.player1.darts = 0;
    gameState.players.player1.legDarts = 0;
    gameState.players.player1.matchDarts = 0;
    gameState.players.player1.legScore = 0;
    gameState.players.player1.matchScore = 0;
    gameState.players.player1.legAvg = 0;
    gameState.players.player1.matchAvg = 0;
    gameState.players.player1.turnHistory = [];
    
    gameState.players.player2.score = startScore;
    gameState.players.player2.preTurnScore = startScore;
    gameState.players.player2.darts = 0;
    gameState.players.player2.legDarts = 0;
    gameState.players.player2.matchDarts = 0;
    gameState.players.player2.legScore = 0;
    gameState.players.player2.matchScore = 0;
    gameState.players.player2.legAvg = 0;
    gameState.players.player2.matchAvg = 0;
    gameState.players.player2.turnHistory = [];
    
    gameState.currentVisit = [];
    gameState.dartsThrown = 0;
    gameState.turnTotal = 0;
    gameState.visitNumber = 1;
    
    showScreen('game-screen');
    updateGameScreen();
    
    // Initialize action button text on game start
    updateActionButtonText();
}

// ===== SCORING LOGIC - TO BE REWRITTEN =====
// All scoring functions, button handlers, and input logic removed
// Ready for new implementation

function updateGameScreen() {
    // Update player displays
    const player1Display = document.getElementById('player1-display');
    const player2Display = document.getElementById('player2-display');
    
    if (!player1Display || !player2Display) {
        console.error('Player displays not found');
        return;
    }
    
    // Update names - show first name when active, last name when inactive
    const p1NameParts = gameState.players.player1.name.split(' ');
    const p1FirstName = p1NameParts[0] || '';
    const p1LastName = p1NameParts[p1NameParts.length - 1];
    const p1DisplayName = gameState.currentPlayer === 1 ? p1FirstName : p1LastName;
    
    const p2NameParts = gameState.players.player2.name.split(' ');
    const p2FirstName = p2NameParts[0] || '';
    const p2LastName = p2NameParts[p2NameParts.length - 1];
    const p2DisplayName = gameState.currentPlayer === 2 ? p2FirstName : p2LastName;
    
    player1Display.querySelector('.player-name-large').textContent = p1DisplayName;
    player2Display.querySelector('.player-name-large').textContent = p2DisplayName;
    
    // Update scores with edit mode styling
    const p1ScoreElement = player1Display.querySelector('.score-large');
    const p2ScoreElement = player2Display.querySelector('.score-large');
    
    // Check if current player is typing a score or has dart scores entered
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const currentPlayer = gameState.players[currentPlayerKey];
    const isTyping = gameState.currentInput.length > 0;
    const hasDartScores = gameState.dartScores.length > 0;
    
    if (isTyping || hasDartScores) {
        // Calculate provisional score including current input and all dart scores
        let totalDartScore = 0;
        
        // Add up all confirmed dart scores
        for (const dart of gameState.dartScores) {
            totalDartScore += dart;
        }
        
        // Add current input if typing
        if (isTyping) {
            totalDartScore += parseInt(gameState.currentInput);
        }
        
        const provisionalScore = currentPlayer.preTurnScore - totalDartScore;
        
        if (gameState.currentPlayer === 1) {
            p1ScoreElement.textContent = provisionalScore;
            p1ScoreElement.classList.add('edit-mode');
            p2ScoreElement.textContent = gameState.players.player2.score;
            p2ScoreElement.classList.remove('edit-mode');
        } else {
            p2ScoreElement.textContent = provisionalScore;
            p2ScoreElement.classList.add('edit-mode');
            p1ScoreElement.textContent = gameState.players.player1.score;
            p1ScoreElement.classList.remove('edit-mode');
        }
    } else {
        // Normal display
        p1ScoreElement.textContent = gameState.players.player1.score;
        p2ScoreElement.textContent = gameState.players.player2.score;
        p1ScoreElement.classList.remove('edit-mode');
        p2ScoreElement.classList.remove('edit-mode');
    }
    
    // Update active player
    if (gameState.currentPlayer === 1) {
        player1Display.classList.add('active');
        player2Display.classList.remove('active');
    } else {
        player2Display.classList.add('active');
        player1Display.classList.remove('active');
    }
    
    // Update set number display
    const setNumberElement = document.getElementById('set-number');
    if (setNumberElement) {
        setNumberElement.textContent = gameState.currentSet || 1;
    }
    
    // Update visit number
    const visitNumberElement = document.querySelector('.visit-number');
    if (visitNumberElement) {
        visitNumberElement.textContent = gameState.visitNumber;
    }
    
    // Update timer (shows darts in current visit)
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = gameState.currentVisit.length;
    }
    
    // Update input mode display
    updateInputDisplay();
    
    // Update dual-function button labels
    updateDualFunctionButtonDisplay();
    
    // Update score history display
    updateScoreHistory();
    
    // Update throw indicator
    updateThrowIndicator();
    
    // Update leg and set scores
    updateLegSetScores();
    
    // Update averages display
    updateAverages();
    
    // Update action button text (UNDO vs Go Back)
    updateActionButtonText();
}

function updateAverages() {
    // Update player 1 averages
    const p1LegAvg = document.getElementById('player1-leg-avg');
    const p1MatchAvg = document.getElementById('player1-match-avg');
    
    if (p1LegAvg) {
        const legAvg = gameState.players.player1.legAvg || 0;
        p1LegAvg.textContent = legAvg.toFixed(2);
    }
    if (p1MatchAvg) {
        const matchAvg = gameState.players.player1.matchAvg || 0;
        p1MatchAvg.textContent = matchAvg.toFixed(2);
    }
    
    // Update player 2 averages
    const p2LegAvg = document.getElementById('player2-leg-avg');
    const p2MatchAvg = document.getElementById('player2-match-avg');
    
    if (p2LegAvg) {
        const legAvg = gameState.players.player2.legAvg || 0;
        p2LegAvg.textContent = legAvg.toFixed(2);
    }
    if (p2MatchAvg) {
        const matchAvg = gameState.players.player2.matchAvg || 0;
        p2MatchAvg.textContent = matchAvg.toFixed(2);
    }
}

function updateLegSetScores() {
    const legScoreDisplay = document.getElementById('leg-score-display');
    const setScoreDisplay = document.getElementById('set-score-display');
    
    if (legScoreDisplay) {
        const p1Legs = gameState.players.player1.legWins || 0;
        const p2Legs = gameState.players.player2.legWins || 0;
        legScoreDisplay.textContent = `${p1Legs} - ${p2Legs}`;
    }
    
    if (setScoreDisplay) {
        const p1Sets = gameState.players.player1.setWins || 0;
        const p2Sets = gameState.players.player2.setWins || 0;
        setScoreDisplay.textContent = `${p1Sets} - ${p2Sets}`;
    }
}

function updateActionButtonText() {
    const actionBtn = document.getElementById('action-btn');
    if (!actionBtn) return;
    
    // Always show UNDO - functionality stays the same regardless
    actionBtn.textContent = 'UNDO';
}

function updateInputDisplay() {
    const inputModeDisplay = document.getElementById('input-mode');
    if (!inputModeDisplay) {
        console.error('input-mode element not found!');
        return;
    }
    
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    console.log('updateInputDisplay called:', {
        currentInput: gameState.currentInput,
        legScore: player.legScore,
        legDarts: player.legDarts,
        gameType: gameState.matchSettings.gameType,
        startType: gameState.matchSettings.startType
    });
    
    // If player is using calculator mode, show the expression
    if (gameState.dartScores.length > 0 || gameState.currentInput) {
        let expression = '';
        
        // Build expression from dart scores
        for (let i = 0; i < gameState.dartScores.length; i++) {
            if (i > 0) expression += '+';
            expression += gameState.dartScores[i];
        }
        
        // Add current input
        if (gameState.currentInput) {
            if (gameState.dartScores.length > 0) expression += '+';
            expression += gameState.currentInput;
        }
        
        inputModeDisplay.textContent = expression;
        console.log('Showing calculator expression:', expression);
        return;
    }
    
    // Check if player has scored yet in this leg (hasn't entered the game)
    const hasNotScored = player.legScore === 0 && player.legDarts === 0;
    
    if (hasNotScored) {
        // Show entry requirement based on game type
        const gameType = gameState.matchSettings.gameType;
        const startType = gameState.matchSettings.startType;
        
        if (gameType === '301') {
            // 301 defaults to DIDO (Double In, Double Out)
            if (startType === 'DIDO' || startType === 'DISO') {
                inputModeDisplay.textContent = 'Double-In';
                console.log('Showing: Double-In');
            } else {
                inputModeDisplay.textContent = 'Straight-In';
                console.log('Showing: Straight-In');
            }
        } else {
            // 501 and other games default to SIDO (Straight In, Double Out)
            if (startType === 'DIDO' || startType === 'DISO') {
                inputModeDisplay.textContent = 'Double-In';
                console.log('Showing: Double-In');
            } else {
                inputModeDisplay.textContent = 'Straight-In';
                console.log('Showing: Straight-In');
            }
        }
    } else {
        // Player has entered the game - show blank (ready for next input)
        inputModeDisplay.textContent = '';
        console.log('Showing: blank (player has scored)');
    }
}

// ===== SCORING FUNCTIONS =====

function addDigit(digit) {
    // Build up the current input (max 3 digits for 0-180)
    if (gameState.currentInput.length < 3) {
        gameState.currentInput += digit;
        updateGameScreen();
    }
}

function addScore(score) {
    // Store the score being entered
    gameState.currentInput = score.toString();
    
    // Update display to show provisional score
    updateGameScreen();
}

function confirmScore() {
    // Called when ENTER is pressed to submit the score
    if (!gameState.currentInput && gameState.dartScores.length === 0) return;
    
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    // Calculate total score from all darts
    let totalScore = 0;
    
    // Add all dart scores
    for (const dart of gameState.dartScores) {
        totalScore += dart;
    }
    
    // Add current input if exists
    if (gameState.currentInput) {
        totalScore += parseInt(gameState.currentInput);
    }
    
    // Validate total score
    if (totalScore < 0 || totalScore > 180) {
        alert('Invalid total score! Must be between 0 and 180.');
        gameState.currentInput = '';
        gameState.dartScores = [];
        updateGameScreen();
        return;
    }
    
    // Add the total score for this turn
    gameState.turnTotal = totalScore;
    gameState.currentVisit.push(totalScore); // Store the total score
    
    // Calculate final score
    const finalScore = player.preTurnScore - gameState.turnTotal;
    player.score = finalScore;
    
    // Clear input and dart scores
    gameState.currentInput = '';
    gameState.dartScores = [];
    
    updateGameScreen();
    
    // Check if player finished (reached 0 or below)
    if (finalScore <= 0) {
        if (finalScore === 0) {
            // Player finished exactly - prompt for darts used
            handleLegWin();
        } else {
            // Player went bust
            handleBust();
        }
    } else {
        // Normal turn - submit after brief delay
        setTimeout(() => submitTurn(), 300);
    }
}

function handleBust() {
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    alert(`BUST! Score reverts to ${player.preTurnScore}`);
    
    // Add bust entry to history with the turn total that caused the bust
    player.turnHistory.push({
        darts: [gameState.turnTotal],
        total: gameState.turnTotal,
        scoreAfter: player.preTurnScore, // Score stays the same after bust
        bust: true
    });
    
    // Revert score
    player.score = player.preTurnScore;
    gameState.currentVisit = [];
    gameState.turnTotal = 0;
    gameState.currentInput = '';
    gameState.dartScores = [];
    
    updateGameScreen();
    
    // Switch to next player after brief delay
    setTimeout(() => switchPlayer(), 500);
}

function handleLegWin() {
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    // Show modal to select darts used to finish
    showFinishDartsModal((finishDarts) => {
        // Validate input
        const actualDarts = Math.min(Math.max(finishDarts, 1), 3);
        
        // Calculate total darts for this leg
        const totalDartsThisLeg = player.legDarts + actualDarts;
        
        // Calculate leg average: (points scored / darts thrown) * 3
        const startScore = gameState.matchSettings.startScore || 501;
        player.legAvg = (startScore / totalDartsThisLeg) * 3;
        
        // Update match stats
        player.legDarts += actualDarts;
        player.matchDarts += actualDarts;
        player.legScore = startScore; // Full starting score for this leg
        // matchScore is already being tracked in submitTurn(), don't add again
        
        // Calculate match average
        if (player.matchDarts > 0) {
            player.matchAvg = (player.matchScore / player.matchDarts) * 3;
        }
        
        // Set score to exactly 0
        player.score = 0;
        
        // Award leg win
        player.legWins++;
        
        // Save to history
        player.turnHistory.push({
            darts: [gameState.turnTotal],
            total: gameState.turnTotal,
            scoreAfter: 0
        });
        
        // Reset turn state
        gameState.currentVisit = [];
        gameState.turnTotal = 0;
        gameState.currentInput = '';
        gameState.dartScores = [];
        
        updateGameScreen();
        
        // Show game shot confirmation
        showGameShotModal();
    });
}

function showFinishDartsModal(callback) {
    const modal = document.getElementById('finish-darts-modal');
    if (!modal) return;
    
    modal.classList.add('show');
    
    // Remove any existing event listeners
    const buttons = modal.querySelectorAll('.finish-dart-btn');
    buttons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Add new event listeners
    const newButtons = modal.querySelectorAll('.finish-dart-btn');
    newButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const darts = parseInt(this.getAttribute('data-darts'));
            modal.classList.remove('show');
            callback(darts);
        });
    });
}

function showGameShotModal() {
    const modal = document.getElementById('game-shot-modal');
    if (!modal) return;
    
    const winnerName = document.getElementById('winner-name');
    const matchScore = document.getElementById('match-score');
    const confirmBtn = document.getElementById('confirm-win-btn');
    const changeBtn = document.getElementById('change-win-btn');
    
    // Get winner info
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const winner = gameState.players[currentPlayerKey];
    
    // Update modal content
    winnerName.textContent = winner.name;
    matchScore.textContent = `${gameState.players.player1.legWins} - ${gameState.players.player2.legWins}`;
    
    // Show modal
    modal.classList.add('show');
    
    // Remove old event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newChangeBtn = changeBtn.cloneNode(true);
    changeBtn.parentNode.replaceChild(newChangeBtn, changeBtn);
    
    // Add confirm button handler
    document.getElementById('confirm-win-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        // Check if set/match is complete
        checkSetWin();
    });
    
    // Add change button handler - allow user to edit last score
    document.getElementById('change-win-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        // Revert the leg win
        const currentPlayerKey = `player${gameState.currentPlayer}`;
        const player = gameState.players[currentPlayerKey];
        player.legWins--;
        player.turnHistory.pop(); // Remove last turn from history
        
        // Restore score to pre-turn state
        player.score = player.preTurnScore;
        
        // Put the score back into input mode (not submitted)
        gameState.currentInput = gameState.turnTotal.toString();
        gameState.currentVisit = [];
        gameState.turnTotal = 0;
        
        updateGameScreen();
    });
}

function submitScore() {
    // Called when ENTER button is pressed
    confirmScore();
}

function quickHitScore(score) {
    // Quick hit buttons (26, 40, 41, 43, 45, 60, 81, 85, 100, 140, 180)
    // Set the score and immediately confirm it
    gameState.currentInput = score.toString();
    confirmScore();
}

function multiplyLastScore() {
    // Multiply button (×3) - treble
    if (gameState.currentInput) {
        // If typing a number, multiply it by 3 and confirm
        const score = parseInt(gameState.currentInput);
        if (score >= 0 && score <= 60) {
            gameState.currentInput = (score * 3).toString();
            confirmScore();
        }
    }
}

function addZero() {
    // 0 button - add zero to current input to make double digit
    if (gameState.currentInput.length > 0 && gameState.currentInput.length < 3) {
        gameState.currentInput += '0';
        updateGameScreen();
    } else if (gameState.currentInput.length === 0) {
        // No input, quick-hit 0 (MISS)
        quickHitScore(0);
    }
}

function doubleLastScore() {
    // Plus button (+) - add current dart score to the running total
    if (gameState.currentInput) {
        const dartScore = parseInt(gameState.currentInput);
        
        // Validate individual dart score (0-180)
        if (dartScore >= 0 && dartScore <= 180) {
            // Add to dart scores array
            gameState.dartScores.push(dartScore);
            
            // Clear current input for next dart
            gameState.currentInput = '';
            
            // Update display to show running calculation
            updateGameScreen();
        } else {
            alert('Invalid dart score! Must be between 0 and 180.');
            gameState.currentInput = '';
            updateGameScreen();
        }
    }
}

function submitTurn() {
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    // Check for good shots and display prompt
    showGoodShotPrompt(gameState.turnTotal);
    
    // Update player stats (assuming 3 darts per turn)
    player.legDarts += 3;
    player.matchDarts += 3;
    player.legScore += gameState.turnTotal;
    player.matchScore += gameState.turnTotal;
    
    // Calculate final score
    player.score = player.preTurnScore - gameState.turnTotal;
    
    // Calculate averages after every turn
    if (player.legDarts > 0) {
        player.legAvg = (player.legScore / player.legDarts) * 3;
    }
    if (player.matchDarts > 0) {
        player.matchAvg = (player.matchScore / player.matchDarts) * 3;
    }
    
    // Save to history
    player.turnHistory.push({
        darts: [gameState.turnTotal], // Store total score
        total: gameState.turnTotal,
        scoreAfter: player.score
    });
    
    // Reset turn state
    gameState.currentVisit = [];
    gameState.turnTotal = 0;
    gameState.currentInput = '';
    gameState.dartScores = [];
    
    // Update display to show new averages
    updateGameScreen();
    
    // Switch to next player
    switchPlayer();
}

function showGoodShotPrompt(score) {
    let message = '';
    
    // Check for good shots: 95-99, 100 (Ton), 101-180 (Ton+)
    if (score >= 95 && score <= 99) {
        message = `${score}!`;
    } else if (score === 100) {
        message = 'TON!';
    } else if (score >= 101 && score <= 109) {
        message = `${score}!`;
    } else if (score >= 110 && score <= 180) {
        const tonValue = score - 100;
        message = `TON${tonValue}!`;
    }
    
    // Display the message if there is one
    if (message) {
        const display = document.getElementById('good-shot-display');
        const text = document.getElementById('good-shot-text');
        
        if (display && text) {
            text.textContent = message;
            display.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                display.style.display = 'none';
            }, 3000);
        }
    }
}

function switchPlayer() {
    // Switch to next player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    // Store pre-turn score for new player
    const newPlayerKey = `player${gameState.currentPlayer}`;
    gameState.players[newPlayerKey].preTurnScore = gameState.players[newPlayerKey].score;
    
    // Increment visit number only when switching TO player 1
    // This way both players throw in the same visit number
    if (gameState.currentPlayer === 1) {
        gameState.visitNumber++;
    }
    
    updateGameScreen();
}

function checkSetWin() {
    const player1 = gameState.players.player1;
    const player2 = gameState.players.player2;
    const settings = gameState.matchSettings;
    
    // Determine legs needed to win based on format
    let legsToWin = settings.legsToWin;
    if (settings.legsFormat === 'play-all') {
        legsToWin = settings.totalLegs;
    }
    
    // Check if either player won the set
    const player1WonSet = player1.legWins >= legsToWin;
    const player2WonSet = player2.legWins >= legsToWin;
    
    if (player1WonSet || player2WonSet) {
        // Award set win
        if (player1WonSet) {
            player1.setWins++;
        } else {
            player2.setWins++;
        }
        
        // Check if match is complete
        const setsToWin = settings.setsFormat === 'best-of' ? settings.setsToWin : settings.totalSets;
        const matchComplete = player1.setWins >= setsToWin || player2.setWins >= setsToWin;
        
        // Show set complete modal
        showSetCompleteModal(matchComplete);
        return;
    }
    
    // If no set win, start a new leg with alternate starter
    startNewLeg();
}

function showSetCompleteModal(matchComplete) {
    const modal = document.getElementById('set-complete-modal');
    if (!modal) return;
    
    const player1 = gameState.players.player1;
    const player2 = gameState.players.player2;
    const settings = gameState.matchSettings;
    
    // Update modal content
    const setNumber = document.getElementById('set-complete-number');
    const homeScore = document.getElementById('set-home-score').querySelector('.score-value');
    const awayScore = document.getElementById('set-away-score').querySelector('.score-value');
    const nextSetText = document.getElementById('next-set-text');
    const nextSetBtn = document.getElementById('next-set-btn');
    
    // Set current set number
    setNumber.textContent = `Set ${String(gameState.currentSet).padStart(2, '0')}`;
    
    // Show set scores (who won this set)
    const player1WonSet = player1.legWins > player2.legWins;
    homeScore.textContent = player1WonSet ? '1' : '0';
    awayScore.textContent = player1WonSet ? '0' : '1';
    
    // Update next set text
    const gameType = settings.gameType === '301' ? '301' : '501';
    const startType = settings.startType || 'SIDO';
    
    if (matchComplete) {
        nextSetText.textContent = `Match Complete: ${player1.name} wins ${player1.setWins}-${player2.setWins}`;
        nextSetBtn.textContent = 'New Match';
    } else {
        nextSetText.textContent = `Next Set: Play ${gameType} ${startType} Again`;
        nextSetBtn.textContent = 'Next Set';
    }
    
    // Show modal
    modal.classList.add('show');
    
    // Remove old event listeners by cloning buttons
    const changePlayersBtn = document.getElementById('change-players-btn');
    const changeGameBtn = document.getElementById('change-game-btn');
    const editSettingsBtn = document.getElementById('edit-match-settings-btn');
    const endMatchBtn = document.getElementById('end-match-btn');
    
    const newNextSetBtn = nextSetBtn.cloneNode(true);
    const newChangePlayersBtn = changePlayersBtn.cloneNode(true);
    const newChangeGameBtn = changeGameBtn.cloneNode(true);
    const newEditSettingsBtn = editSettingsBtn.cloneNode(true);
    const newEndMatchBtn = endMatchBtn.cloneNode(true);
    
    nextSetBtn.parentNode.replaceChild(newNextSetBtn, nextSetBtn);
    changePlayersBtn.parentNode.replaceChild(newChangePlayersBtn, changePlayersBtn);
    changeGameBtn.parentNode.replaceChild(newChangeGameBtn, changeGameBtn);
    editSettingsBtn.parentNode.replaceChild(newEditSettingsBtn, editSettingsBtn);
    endMatchBtn.parentNode.replaceChild(newEndMatchBtn, endMatchBtn);
    
    // Next Set button - Continue match with next set
    document.getElementById('next-set-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        
        if (matchComplete) {
            // Match is over - go back to player selection
            endMatch();
        } else {
            // Start next set
            startNextSet();
        }
    });
    
    // Change Players button - Go to player library but keep match score
    document.getElementById('change-players-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        gameState.isChangingPlayers = true;
        showScreen('player-selection-screen');
        renderPlayerSelectionLists();
    });
    
    // Change Game button - Change game type but keep match score
    document.getElementById('change-game-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        gameState.isChangingGame = true;
        showScreen('game-type-select-screen');
    });
    
    // Edit Match Settings button - Update match format but keep scores
    document.getElementById('edit-match-settings-btn').addEventListener('click', function() {
        modal.classList.remove('show');
        gameState.isEditingSettings = true;
        // Open format selection to update legs/sets
        showScreen('format-select-screen');
    });
    
    // End Match button - End match and reset everything
    document.getElementById('end-match-btn').addEventListener('click', function() {
        const confirmed = confirm('Are you sure you want to end the match? All progress will be lost.');
        if (confirmed) {
            modal.classList.remove('show');
            endMatch();
        }
    });
}

function startNextSet() {
    const startScore = gameState.matchSettings.startScore || 501;
    
    // Increment set number
    gameState.currentSet++;
    
    // Reset leg wins for both players
    gameState.players.player1.legWins = 0;
    gameState.players.player2.legWins = 0;
    
    // Reset leg-specific stats
    gameState.players.player1.score = startScore;
    gameState.players.player1.preTurnScore = startScore;
    gameState.players.player1.legDarts = 0;
    gameState.players.player1.legScore = 0;
    gameState.players.player1.legAvg = 0;
    gameState.players.player1.turnHistory = [];
    
    gameState.players.player2.score = startScore;
    gameState.players.player2.preTurnScore = startScore;
    gameState.players.player2.legDarts = 0;
    gameState.players.player2.legScore = 0;
    gameState.players.player2.legAvg = 0;
    gameState.players.player2.turnHistory = [];
    
    // Reset game state
    gameState.currentVisit = [];
    gameState.visitNumber = 1;
    gameState.currentInput = '';
    gameState.dartScores = [];
    gameState.turnTotal = 0;
    
    // Determine who starts this set (opposite of who started previous set)
    const firstSetStarter = gameState.matchSettings.firstLegStarter;
    if (gameState.currentSet % 2 === 1) {
        // Odd set - use original starter
        gameState.setStarter = firstSetStarter;
    } else {
        // Even set - use opposite starter
        gameState.setStarter = firstSetStarter === 1 ? 2 : 1;
    }
    
    // First leg of set starts with setStarter
    gameState.legStarter = gameState.setStarter;
    gameState.currentPlayer = gameState.legStarter;
    
    // Update display
    updateGameScreen();
}

function startNewLeg() {
    const startScore = gameState.matchSettings.startScore || 501;
    
    // Increment leg counter
    gameState.currentLeg++;
    
    // Reset leg-specific stats
    gameState.players.player1.score = startScore;
    gameState.players.player1.preTurnScore = startScore;
    gameState.players.player1.legDarts = 0;
    gameState.players.player1.legScore = 0;
    gameState.players.player1.legAvg = 0;
    gameState.players.player1.turnHistory = [];
    
    gameState.players.player2.score = startScore;
    gameState.players.player2.preTurnScore = startScore;
    gameState.players.player2.legDarts = 0;
    gameState.players.player2.legScore = 0;
    gameState.players.player2.legAvg = 0;
    gameState.players.player2.turnHistory = [];
    
    // Reset game state
    gameState.currentVisit = [];
    gameState.visitNumber = 1;
    gameState.currentInput = '';
    gameState.dartScores = [];
    gameState.turnTotal = 0;
    
    // Alternate starter within the set
    // If setStarter is not set yet (first leg of match), use legStarter
    if (gameState.setStarter === null) {
        gameState.setStarter = gameState.legStarter;
    }
    
    // Count legs in current set to determine alternation
    const legsPlayed = gameState.players.player1.legWins + gameState.players.player2.legWins;
    
    // Alternate based on leg number within set
    if (legsPlayed % 2 === 0) {
        // Even legs (0, 2, 4...) - setStarter starts
        gameState.legStarter = gameState.setStarter;
    } else {
        // Odd legs (1, 3, 5...) - opposite player starts
        gameState.legStarter = gameState.setStarter === 1 ? 2 : 1;
    }
    
    gameState.currentPlayer = gameState.legStarter;
    
    // Update display
    updateGameScreen();
    updateActionButtonText();
}

function endMatch() {
    // Reset all match data
    const startScore = gameState.matchSettings.startScore || 501;
    
    // Reset both players completely
    gameState.players.player1.score = startScore;
    gameState.players.player1.preTurnScore = startScore;
    gameState.players.player1.darts = 0;
    gameState.players.player1.legDarts = 0;
    gameState.players.player1.matchDarts = 0;
    gameState.players.player1.legScore = 0;
    gameState.players.player1.matchScore = 0;
    gameState.players.player1.legAvg = 0;
    gameState.players.player1.matchAvg = 0;
    gameState.players.player1.legWins = 0;
    gameState.players.player1.setWins = 0;
    gameState.players.player1.turnHistory = [];
    
    gameState.players.player2.score = startScore;
    gameState.players.player2.preTurnScore = startScore;
    gameState.players.player2.darts = 0;
    gameState.players.player2.legDarts = 0;
    gameState.players.player2.matchDarts = 0;
    gameState.players.player2.legScore = 0;
    gameState.players.player2.matchScore = 0;
    gameState.players.player2.legAvg = 0;
    gameState.players.player2.matchAvg = 0;
    gameState.players.player2.legWins = 0;
    gameState.players.player2.setWins = 0;
    gameState.players.player2.turnHistory = [];
    
    // Reset game state
    gameState.currentSet = 1;
    gameState.currentLeg = 1;
    gameState.currentVisit = [];
    gameState.visitNumber = 1;
    gameState.currentInput = '';
    gameState.dartScores = [];
    gameState.turnTotal = 0;
    gameState.legStarter = null;
    gameState.setStarter = null;
    gameState.isChangingPlayers = false;
    gameState.isChangingGame = false;
    gameState.isEditingSettings = false;
    
    // Update player selection screen displays
    updatePlayerSelectionDisplays();
    
    // Go back to player selection
    showScreen('player-selection-screen');
}

function updateGameAfterChange() {
    // Update start score based on new game type
    const startScore = gameState.matchSettings.startScore;
    
    // Reset current leg scores to new game type
    gameState.players.player1.score = startScore;
    gameState.players.player1.preTurnScore = startScore;
    gameState.players.player1.legDarts = 0;
    gameState.players.player1.legScore = 0;
    gameState.players.player1.legAvg = 0;
    gameState.players.player1.turnHistory = [];
    
    gameState.players.player2.score = startScore;
    gameState.players.player2.preTurnScore = startScore;
    gameState.players.player2.legDarts = 0;
    gameState.players.player2.legScore = 0;
    gameState.players.player2.legAvg = 0;
    gameState.players.player2.turnHistory = [];
    
    // Reset current turn state
    gameState.currentVisit = [];
    gameState.dartScores = [];
    gameState.currentInput = '';
    gameState.turnTotal = 0;
    gameState.visitNumber = 1;
    
    // Clear flag and return to game
    gameState.isChangingGame = false;
    showScreen('game-screen');
    updateGameScreen();
}

function handleDualFunctionButton(button, defaultScore) {
    // Dual-function buttons: 100 (×), 180 (0), 140 (+)
    const hasInput = gameState.currentVisit.length > 0 || gameState.currentInput;
    
    if (button.id === 'btn-100-multiply') {
        if (hasInput) {
            // × mode - multiply by 3
            multiplyLastScore();
        } else {
            // 100 mode - quick hit
            quickHitScore(100);
        }
    } else if (button.id === 'btn-180-zero') {
        if (hasInput) {
            // 0 mode - add zero
            addZero();
        } else {
            // 180 mode - quick hit
            quickHitScore(180);
        }
    } else if (button.id === 'btn-140-plus') {
        if (hasInput) {
            // + mode - add score
            doubleLastScore();
        } else {
            // 140 mode - quick hit
            quickHitScore(140);
        }
    }
}

function updateDualFunctionButtonDisplay() {
    const hasInput = gameState.currentVisit.length > 0 || gameState.currentInput || gameState.dartScores.length > 0;
    
    // Update button 100/×
    const btn100 = document.getElementById('btn-100-multiply');
    if (btn100) {
        btn100.textContent = hasInput ? '×' : '100';
    }
    
    // Update button 180/0
    const btn180 = document.getElementById('btn-180-zero');
    if (btn180) {
        btn180.textContent = hasInput ? '0' : '180';
    }
    
    // Update button 140/+
    const btn140 = document.getElementById('btn-140-plus');
    if (btn140) {
        btn140.textContent = hasInput ? '+' : '140';
    }
    
    // Update MISS/ENTER button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        if (gameState.currentInput || gameState.dartScores.length > 0) {
            submitBtn.textContent = 'ENTER';
            submitBtn.classList.remove('red');
            submitBtn.classList.add('green');
        } else {
            submitBtn.textContent = 'MISS';
            submitBtn.classList.add('red');
            submitBtn.classList.remove('green');
        }
    }
}

function updateScoreHistory() {
    const historyContainer = document.getElementById('score-history');
    if (!historyContainer) return;
    
    // Get the history for both players
    const p1History = gameState.players.player1.turnHistory;
    const p2History = gameState.players.player2.turnHistory;
    
    // The current visit number shows which turn we're on
    const currentVisit = gameState.visitNumber;
    
    // Clear and rebuild the display
    historyContainer.innerHTML = '';
    
    // Display all visits from 1 to current (full log)
    for (let visit = 1; visit <= currentVisit; visit++) {
        const entry = document.createElement('div');
        const isCurrentTurn = (visit === currentVisit);
        entry.className = isCurrentTurn ? 'score-entry active' : 'score-entry';
        
        // Player 1 column
        const p1Column = document.createElement('div');
        p1Column.className = 'player-column';
        
        // Check if player 1 has completed this turn
        const p1TurnIndex = visit - 1;
        if (p1TurnIndex < p1History.length) {
            const turnData = p1History[p1TurnIndex];
            const displayText = turnData.bust ? `${turnData.total} (BUST)` : turnData.total;
            p1Column.innerHTML = `<div class="darts">${displayText}</div>`;
        } else if (isCurrentTurn && gameState.currentPlayer === 1 && gameState.currentVisit.length > 0) {
            // Player 1 is currently throwing
            p1Column.innerHTML = `<div class="darts">${gameState.turnTotal}</div>`;
        }
        
        // Turn number column with arrow indicator
        const turnColumn = document.createElement('div');
        turnColumn.className = 'turn-info';
        
        if (isCurrentTurn) {
            // Show arrow for current player
            if (gameState.currentPlayer === 1) {
                turnColumn.innerHTML = `<span class="turn-arrow">← ${visit}</span>`;
            } else {
                turnColumn.innerHTML = `<span class="turn-arrow">${visit} →</span>`;
            }
        } else {
            // Just show turn number for completed turns
            turnColumn.innerHTML = `<span class="turn-number">${visit}</span>`;
        }
        
        // Player 2 column
        const p2Column = document.createElement('div');
        p2Column.className = 'player-column';
        
        // Check if player 2 has completed this turn
        const p2TurnIndex = visit - 1;
        if (p2TurnIndex < p2History.length) {
            const turnData = p2History[p2TurnIndex];
            const displayText = turnData.bust ? `${turnData.total} (BUST)` : turnData.total;
            p2Column.innerHTML = `<div class="darts">${displayText}</div>`;
        } else if (isCurrentTurn && gameState.currentPlayer === 2 && gameState.currentVisit.length > 0) {
            // Player 2 is currently throwing
            p2Column.innerHTML = `<div class="darts">${gameState.turnTotal}</div>`;
        }
        
        entry.appendChild(p1Column);
        entry.appendChild(turnColumn);
        entry.appendChild(p2Column);
        
        historyContainer.appendChild(entry);
    }
    
    // Smooth auto-scroll to bottom to show latest entries
    historyContainer.scrollTo({
        top: historyContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function updateThrowIndicator() {
    const player1Indicator = document.getElementById('player1-throw');
    const player2Indicator = document.getElementById('player2-throw');
    
    if (!player1Indicator || !player2Indicator) return;
    
    // Clear both indicators
    player1Indicator.classList.remove('active');
    player2Indicator.classList.remove('active');
    
    // Show indicator for whoever started this leg
    if (gameState.legStarter === 1) {
        player1Indicator.classList.add('active');
    } else if (gameState.legStarter === 2) {
        player2Indicator.classList.add('active');
    }
}

// updateDualFunctionButtons removed - will be rewritten

// addScore function removed - will be rewritten

// handleBust function removed - will be rewritten

// handleWin function removed - will be rewritten

// completeTurn function removed - will be rewritten

// switchPlayer function removed - will be rewritten

// Duplicate checkSetWin, checkMatchWin, startNewLeg, startNewSet removed - using versions above

// ===== INITIALIZATION =====

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing...');
    
    await initializePlayerLibrary();
    renderPlayerSelectionLists();
    showScreen('player-selection-screen');
    
    // Attach number button event handlers
    const numButtons = document.querySelectorAll('.num-btn[data-score]');
    numButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const score = this.getAttribute('data-score');
            
            // Check if this is a dual-function button
            if (this.classList.contains('dual-function')) {
                handleDualFunctionButton(this, parseInt(score));
            } else if (this.classList.contains('edge')) {
                // Quick-hit buttons (26, 40, 41, 43, 45, 60, 81, 85)
                quickHitScore(parseInt(score));
            } else {
                // Regular number buttons (1-9)
                addDigit(score);
            }
        });
    });
    
    // Submit button - MISS (quick-hit 0) or ENTER (submit input)
    document.getElementById('submit-btn')?.addEventListener('click', function() {
        if (gameState.currentInput) {
            // ENTER mode - submit the typed score
            submitScore();
        } else {
            // MISS mode - quick-hit 0
            quickHitScore(0);
        }
    });
    
    // Action button - undo or back to starting player
    document.getElementById('action-btn')?.addEventListener('click', function() {
        // Check if this is a fresh game (no scores entered by anyone)
        const player1Fresh = gameState.players.player1.legScore === 0 && gameState.players.player1.legDarts === 0;
        const player2Fresh = gameState.players.player2.legScore === 0 && gameState.players.player2.legDarts === 0;
        const noCurrentInput = !gameState.currentInput && gameState.currentVisit.length === 0 && gameState.dartScores.length === 0;
        
        if (player1Fresh && player2Fresh && noCurrentInput) {
            // Fresh game, no inputs - go back to starting player selection
            showScreen('starting-player-screen');
            updateStartingPlayerScreen();
        } else if (gameState.currentInput) {
            // Remove last digit from current input
            gameState.currentInput = gameState.currentInput.slice(0, -1);
            updateGameScreen();
        } else if (gameState.dartScores.length > 0) {
            // Remove last dart score from calculator
            gameState.dartScores.pop();
            updateGameScreen();
        }
    });
    
    // Player name click handlers - allow changing starting player when no scores entered
    document.getElementById('player1-display')?.addEventListener('click', function() {
        const player1Fresh = gameState.players.player1.legScore === 0 && gameState.players.player1.legDarts === 0;
        const player2Fresh = gameState.players.player2.legScore === 0 && gameState.players.player2.legDarts === 0;
        const noCurrentInput = !gameState.currentInput && gameState.currentVisit.length === 0 && gameState.dartScores.length === 0;
        
        if (player1Fresh && player2Fresh && noCurrentInput) {
            // Set player 1 as starting player
            gameState.currentPlayer = 1;
            gameState.legStarter = 1;
            updateGameScreen();
        }
    });
    
    document.getElementById('player2-display')?.addEventListener('click', function() {
        const player1Fresh = gameState.players.player1.legScore === 0 && gameState.players.player1.legDarts === 0;
        const player2Fresh = gameState.players.player2.legScore === 0 && gameState.players.player2.legDarts === 0;
        const noCurrentInput = !gameState.currentInput && gameState.currentVisit.length === 0 && gameState.dartScores.length === 0;
        
        if (player1Fresh && player2Fresh && noCurrentInput) {
            // Set player 2 as starting player
            gameState.currentPlayer = 2;
            gameState.legStarter = 2;
            updateGameScreen();
        }
    });
    
    console.log('All scoring event handlers attached');
    
    // Number pad scoring and keyboard handlers removed - will be rewritten
    console.log('Player library initialized, ready for scoring logic');
});


// All duplicate event handlers removed - scoring logic will be rewritten
