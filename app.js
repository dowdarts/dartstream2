// Game State
const gameState = {
    currentScreen: 'player-selection-screen',
    gameMode: null,
    players: {
        player1: { name: 'Home', score: 501, darts: 0, legWins: 0, setWins: 0, matchAvg: 0, legAvg: 0 },
        player2: { name: 'Away', score: 501, darts: 0, legWins: 0, setWins: 0, matchAvg: 0, legAvg: 0 }
    },
    currentPlayer: 2, // 1 or 2
    currentVisit: [],
    visitNumber: 1,
    currentSet: 1,
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
    
    // Track first leg starter if not set
    if (gameState.matchSettings.firstLegStarter === null) {
        gameState.matchSettings.firstLegStarter = gameState.currentPlayer;
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
    showScreen('starting-player-screen');
    updateStartingPlayerScreen();
});

document.getElementById('select-501-game').addEventListener('click', function() {
    gameState.matchSettings.gameType = '501';
    gameState.matchSettings.startType = 'SIDO';
    gameState.matchSettings.startScore = 501;
    showScreen('starting-player-screen');
    updateStartingPlayerScreen();
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

// Back to Players button on game screen
document.getElementById('back-to-players').addEventListener('click', function() {
    showScreen('player-selection-screen');
});

// Connect button (no function for now)
document.getElementById('connect-btn').addEventListener('click', function() {
    // Will be used later to connect to TV scoreboard
    console.log('Connect button clicked - functionality to be implemented');
});


// Start Game
function startGame() {
    // Reset game state for new game
    const startScore = gameState.matchSettings.gameType === '301' ? 301 : 501;
    gameState.players.player1.score = startScore;
    gameState.players.player2.score = startScore;
    gameState.players.player1.darts = 0;
    gameState.players.player2.darts = 0;
    gameState.currentVisit = [];
    gameState.visitNumber = 1;
    
    showScreen('game-screen');
    updateGameScreen();
}

function updateGameScreen() {
    // Update player displays
    const player1Display = document.getElementById('player1-display');
    const player2Display = document.getElementById('player2-display');
    
    // Update names
    player1Display.querySelector('.player-name-large').textContent = gameState.players.player1.name;
    player2Display.querySelector('.player-name-large').textContent = gameState.players.player2.name;
    
    // Update scores
    player1Display.querySelector('.score-large').textContent = gameState.players.player1.score;
    player2Display.querySelector('.score-large').textContent = gameState.players.player2.score;
    
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
    document.querySelector('.visit-number').textContent = gameState.visitNumber;
    
    // Update timer (shows darts in current visit)
    document.getElementById('timer').textContent = gameState.currentVisit.length;
    
    // Update checkout hints
    updateCheckoutHints();
}

function updateCheckoutHints() {
    const p1Score = gameState.players.player1.score;
    const p2Score = gameState.players.player2.score;
    
    document.getElementById('player1-checkout').textContent = p1Score <= 170 ? 'HC' : 'HC';
    document.getElementById('player2-checkout').textContent = p2Score <= 170 ? 'HC' : 'HC';
}

// Number Pad Scoring
document.querySelectorAll('.num-btn[data-score]').forEach(btn => {
    btn.addEventListener('click', function() {
        const score = parseInt(this.getAttribute('data-score'));
        addScore(score);
    });
});

function addScore(score) {
    if (gameState.currentVisit.length >= 3) {
        return; // Already thrown 3 darts
    }
    
    gameState.currentVisit.push(score);
    
    if (gameState.currentVisit.length === 3) {
        // Auto-submit after 3 darts
        setTimeout(() => submitVisit(), 500);
    } else {
        updateGameScreen();
    }
}

function submitVisit() {
    const visitTotal = gameState.currentVisit.reduce((a, b) => a + b, 0);
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const player = gameState.players[currentPlayerKey];
    
    // Update score
    const newScore = player.score - visitTotal;
    
    // Check for bust or invalid finish
    if (newScore < 0 || newScore === 1) {
        // Bust - score stays the same
        alert('Bust! Score remains the same.');
    } else if (newScore === 0) {
        // Check if finished on double (simplified - would need to track last dart)
        if (gameState.matchSettings.startType === 'SIDO' || gameState.matchSettings.startType === 'DIDO') {
            // Win the leg
            player.score = 0;
            player.darts += gameState.currentVisit.length;
            calculateAverages(currentPlayerKey);
            endLeg();
            return;
        }
    } else {
        // Valid score
        player.score = newScore;
        player.darts += gameState.currentVisit.length;
    }
    
    // Calculate averages
    calculateAverages(currentPlayerKey);
    
    // Next player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.currentVisit = [];
    
    if (gameState.currentPlayer === 1) {
        gameState.visitNumber++;
    }
    
    updateGameScreen();
}

function calculateAverages(playerKey) {
    const player = gameState.players[playerKey];
    
    if (player.darts > 0) {
        // Calculate 3-dart average: (total points scored / darts thrown) * 3
        const startScore = gameState.matchSettings.gameType === '301' ? 301 : 501;
        const pointsScored = startScore - player.score;
        player.legAvg = (pointsScored / player.darts) * 3;
        player.matchAvg = player.legAvg; // Simplified - would track across legs
    }
}

function endLeg() {
    const winner = gameState.currentPlayer;
    const winnerKey = `player${winner}`;
    gameState.players[winnerKey].legWins++;
    
    alert(`${gameState.players[winnerKey].name} wins the leg!`);
    
    // Check if match is won
    if (gameState.players[winnerKey].legWins >= gameState.matchSettings.legsToWin) {
        endMatch();
    } else {
        // Start new leg
        startNewLeg();
    }
}

function startNewLeg() {
    const startScore = gameState.matchSettings.gameType === '301' ? 301 : 501;
    gameState.players.player1.score = startScore;
    gameState.players.player2.score = startScore;
    gameState.players.player1.darts = 0;
    gameState.players.player2.darts = 0;
    gameState.currentVisit = [];
    gameState.visitNumber = 1;
    
    // Alternate starting player
    if (gameState.matchSettings.playerStartFormat === 'alternate') {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    
    updateGameScreen();
}

function endMatch() {
    const winner = gameState.currentPlayer;
    const winnerKey = `player${winner}`;
    alert(`${gameState.players[winnerKey].name} wins the match!`);
    
    // Return to game mode selection
    showScreen('game-mode-screen');
}

// Number pad state management
let currentInput = [];
let inputHistory = [];

function switchToInputMode() {
    // Change BACK to UNDO
    const actionBtn = document.getElementById('action-btn');
    actionBtn.textContent = 'UNDO';
    actionBtn.classList.remove('yellow');
    actionBtn.classList.add('red');
    
    // Change MISS to ENTER
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.textContent = 'ENTER';
    submitBtn.classList.remove('red');
    submitBtn.classList.add('green');
    
    // Show zero button, hide 180 button
    document.getElementById('zero-btn').style.display = 'block';
    document.querySelector('[data-score="180"]').style.display = 'none';
}

function switchToDefaultMode() {
    // Change UNDO to BACK
    const actionBtn = document.getElementById('action-btn');
    actionBtn.textContent = 'BACK';
    actionBtn.classList.remove('red');
    actionBtn.classList.add('yellow');
    
    // Change ENTER to MISS
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.textContent = 'MISS';
    submitBtn.classList.remove('green');
    submitBtn.classList.add('red');
    
    // Hide zero button, show 180 button
    document.getElementById('zero-btn').style.display = 'none';
    document.querySelector('[data-score="180"]').style.display = 'block';
    
    // Clear current input
    currentInput = [];
    document.getElementById('input-mode').textContent = 'Straight-In';
}

// Number button clicks
document.querySelectorAll('.num-btn[data-score]').forEach(btn => {
    btn.addEventListener('click', function() {
        const score = this.dataset.score;
        currentInput.push(score);
        
        // Switch to input mode
        switchToInputMode();
        
        // Display current input
        document.getElementById('input-mode').textContent = currentInput.join(' + ');
    });
});

// Action button (BACK / UNDO)
document.getElementById('action-btn').addEventListener('click', function() {
    if (this.textContent === 'UNDO') {
        // Undo last input
        if (currentInput.length > 0) {
            currentInput.pop();
            
            if (currentInput.length === 0) {
                switchToDefaultMode();
            } else {
                document.getElementById('input-mode').textContent = currentInput.join(' + ');
            }
        }
    } else {
        // BACK - return to player selection
        showScreen('player-selection-screen');
    }
});

// Submit button (MISS / ENTER)
document.getElementById('submit-btn').addEventListener('click', function() {
    if (this.textContent === 'ENTER') {
        // Submit the score
        const totalScore = currentInput.reduce((sum, val) => sum + parseInt(val), 0);
        
        // Add to game state
        gameState.currentVisit.push(totalScore);
        inputHistory.push([...currentInput]);
        
        // Process the score
        const currentPlayerKey = `player${gameState.currentPlayer}`;
        gameState.players[currentPlayerKey].score -= totalScore;
        gameState.players[currentPlayerKey].darts += currentInput.length;
        
        // Check for win or bust
        if (gameState.players[currentPlayerKey].score === 0) {
            endLeg();
        } else if (gameState.players[currentPlayerKey].score < 0) {
            // Bust - restore score
            gameState.players[currentPlayerKey].score += totalScore;
            gameState.players[currentPlayerKey].darts -= currentInput.length;
            alert('BUST!');
        }
        
        // Switch back to default mode
        switchToDefaultMode();
        updateGameScreen();
        
    } else {
        // MISS - record a miss
        gameState.currentVisit.push(0);
        gameState.players[`player${gameState.currentPlayer}`].darts++;
        updateGameScreen();
    }
});

document.getElementById('back-btn')?.addEventListener('click', function() {
    if (gameState.currentVisit.length > 0) {
        gameState.currentVisit.pop();
        updateGameScreen();
    }
});

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    await initializePlayerLibrary();
    renderPlayerSelectionLists();
    showScreen('player-selection-screen');
});
