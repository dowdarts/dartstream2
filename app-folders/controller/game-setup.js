// ===== GAME SETUP MODULE =====
// Handles game mode selection, player selection, and X01 settings
// Exports setupGame() that returns complete game configuration

import { PlayerLibraryModule } from './player-library.js';

export const GameSetupModule = {
    selectedPlayersForGame: [],
    selectedPlayersForDelete: [],
    libraryMode: 'select', // 'select', 'edit', 'delete'
    filteringActive: false,
    currentEditingPlayer: null, // Track player being edited
    
    gameConfig: {
        gameType: '501',
        startScore: 501,
        startType: 'SIDO', // SIDO, DIDO, SISO, DISO
        finishType: 'Double Out', // 'Double Out' or 'Straight Out'
        legsFormat: 'best-of',
        totalLegs: 3,
        legsToWin: 2,
        setsFormat: 'best-of',
        totalSets: 1,
        setsToWin: 1,
        player1Name: 'Home',
        player2Name: 'Away',
        gameMode: null // 'quick-501', 'extended-501', 'custom', etc.
    },
    
    // Initialize game setup UI
    initialize() {
        this.attachEventHandlers();
    },
    
    // Attach all event handlers for game setup screens
    attachEventHandlers() {
        // Game mode selection buttons
        document.querySelectorAll('[data-game]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleGameModeSelection(e));
        });
        
        // Player library management
        document.getElementById('manage-library')?.addEventListener('click', () => this.openPlayerLibrary());
        
        // Player library modal buttons
        this.attachPlayerLibraryHandlers();
        
        // Player selection handlers
        this.attachPlayerSelectionHandlers();
        
        // Match settings handlers
        this.attachMatchSettingsHandlers();
        
        // Note: Start game button is handled by app-main.js
    },
    
    // Handle game mode selection
    handleGameModeSelection(e) {
        const gameType = e.target.getAttribute('data-game');
        
        switch(gameType) {
            case 'quick-501':
                this.gameConfig.gameType = '501';
                this.gameConfig.startScore = 501;
                this.gameConfig.startType = 'SIDO';
                this.gameConfig.finishType = 'Double Out';
                this.gameConfig.totalLegs = 3;
                this.gameConfig.legsToWin = 2;
                this.gameConfig.gameMode = 'quick-501';
                this.showPlayerSelection();
                break;
                
            case 'extended-501':
                this.gameConfig.gameType = '501';
                this.gameConfig.startScore = 501;
                this.gameConfig.startType = 'SIDO';
                this.gameConfig.finishType = 'Double Out';
                this.gameConfig.totalLegs = 9;
                this.gameConfig.legsToWin = 5;
                this.gameConfig.gameMode = 'extended-501';
                this.showPlayerSelection();
                break;
                
            case 'quick-301':
                this.gameConfig.gameType = '301';
                this.gameConfig.startScore = 301;
                this.gameConfig.startType = 'DIDO';
                this.gameConfig.finishType = 'Double Out';
                this.gameConfig.totalLegs = 3;
                this.gameConfig.legsToWin = 2;
                this.gameConfig.gameMode = 'quick-301';
                this.showPlayerSelection();
                break;
                
            case 'extended-301':
                this.gameConfig.gameType = '301';
                this.gameConfig.startScore = 301;
                this.gameConfig.startType = 'DIDO';
                this.gameConfig.finishType = 'Double Out';
                this.gameConfig.totalLegs = 5;
                this.gameConfig.legsToWin = 3;
                this.gameConfig.gameMode = 'extended-301';
                this.showPlayerSelection();
                break;
                
            case 'custom':
                this.showModal('match-settings-modal');
                break;
        }
    },
    
    // Show player selection screen
    showPlayerSelection() {
        this.showScreen('player-selection-screen');
        // Use timeout to ensure DOM is fully updated
        setTimeout(() => {
            this.renderPlayerSelectionLists();
        }, 100);
    },
    
    // Open player library modal
    openPlayerLibrary() {
        if (!this.filteringActive) {
            this.selectedPlayersForGame = PlayerLibraryModule.getAllPlayers().map(player => 
                `${player.firstName} ${player.lastName}`
            );
        }
        this.filteringActive = true;
        this.showModal('player-library-modal');
        this.libraryMode = 'select';
        this.updateLibraryButtonStates();
        this.renderPlayerLibrary();
    },
    
    // Render player library grid
    renderPlayerLibrary() {
        const grid = document.getElementById('player-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const players = PlayerLibraryModule.getAllPlayers();
        
        players.forEach((player) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.dataset.playerId = player.id;
            
            const playerName = `${player.firstName} ${player.lastName}`;
            
            if (this.selectedPlayersForGame.includes(playerName)) {
                card.classList.add('selected-for-game');
            }
            
            if (this.selectedPlayersForDelete.includes(playerName)) {
                card.classList.add('selected-for-delete');
            }
            
            // Check if player has linked account with email
            const hasLinkedAccount = player.account_linked_player_id && player.email;
            
            card.innerHTML = `
                ${hasLinkedAccount ? '<div class="account-linked-badge"></div>' : ''}
                <div class="name">${player.firstName}</div>
                <div class="surname">${player.lastName}</div>
            `;
            
            card.addEventListener('click', () => this.handlePlayerCardClick(player, playerName, card));
            grid.appendChild(card);
        });
    },
    
    // Handle player card click in library
    handlePlayerCardClick(player, playerName, cardElement) {
        if (this.libraryMode === 'select') {
            const indexInSelected = this.selectedPlayersForGame.indexOf(playerName);
            
            if (indexInSelected > -1) {
                this.selectedPlayersForGame.splice(indexInSelected, 1);
                cardElement.classList.remove('selected-for-game');
            } else {
                this.selectedPlayersForGame.push(playerName);
                cardElement.classList.add('selected-for-game');
            }
        } else if (this.libraryMode === 'edit') {
            // Open edit modal with player data
            this.currentEditingPlayer = player;
            document.getElementById('edit-player-firstname').value = player.firstName || '';
            document.getElementById('edit-player-lastname').value = player.lastName || '';
            document.getElementById('edit-player-id').value = player.id || '';
            document.getElementById('edit-player-email').value = player.email || '';
            document.getElementById('edit-player-nationality').value = player.nationality || '';
            this.hideModal('player-library-modal');
            this.showModal('edit-player-modal');
        } else if (this.libraryMode === 'delete') {
            const indexInDelete = this.selectedPlayersForDelete.indexOf(playerName);
            
            if (indexInDelete > -1) {
                this.selectedPlayersForDelete.splice(indexInDelete, 1);
                cardElement.classList.remove('selected-for-delete');
            } else {
                this.selectedPlayersForDelete.push(playerName);
                cardElement.classList.add('selected-for-delete');
            }
            
            this.updateLibraryButtonStates();
        }
    },
    
    // Update player library button states
    updateLibraryButtonStates() {
        const buttons = document.querySelectorAll('#player-library-modal .lib-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        const continueButton = document.getElementById('library-continue-btn');
        if (!continueButton) return;
        
        if (this.libraryMode === 'edit') {
            buttons[2]?.classList.add('selected');
            continueButton.textContent = 'Continue';
            continueButton.className = 'lib-footer-btn green';
        } else if (this.libraryMode === 'delete') {
            buttons[3]?.classList.add('selected');
            
            if (this.selectedPlayersForDelete.length > 0) {
                continueButton.textContent = `Delete (${this.selectedPlayersForDelete.length})`;
                continueButton.className = 'lib-footer-btn red';
            } else {
                continueButton.textContent = 'Continue';
                continueButton.className = 'lib-footer-btn green';
            }
        } else {
            continueButton.textContent = 'Continue';
            continueButton.className = 'lib-footer-btn green';
        }
    },
    
    // Attach player library modal handlers
    attachPlayerLibraryHandlers() {
        // Reset button
        document.querySelector('#player-library-modal .lib-btn:nth-child(1)')?.addEventListener('click', () => {
            this.selectedPlayersForGame = [];
            this.selectedPlayersForDelete = [];
            this.filteringActive = false;
            this.renderPlayerLibrary();
        });
        
        // New button
        document.querySelector('#player-library-modal .lib-btn:nth-child(2)')?.addEventListener('click', () => {
            this.showModal('add-player-modal');
            document.getElementById('new-player-firstname').value = '';
            document.getElementById('new-player-lastname').value = '';
            setTimeout(() => {
                document.getElementById('new-player-firstname').focus();
            }, 100);
        });
        
        // Edit button
        document.querySelector('#player-library-modal .lib-btn:nth-child(3)')?.addEventListener('click', () => {
            this.libraryMode = this.libraryMode === 'edit' ? 'select' : 'edit';
            this.updateLibraryButtonStates();
        });
        
        // Delete button
        document.querySelector('#player-library-modal .lib-btn:nth-child(4)')?.addEventListener('click', () => {
            if (this.libraryMode === 'delete') {
                this.selectedPlayersForDelete = [];
                this.libraryMode = 'select';
                this.updateLibraryButtonStates();
                this.renderPlayerLibrary();
            } else {
                this.selectedPlayersForDelete = [];
                this.libraryMode = 'delete';
                this.updateLibraryButtonStates();
            }
        });
        
        // Continue button
        document.getElementById('library-continue-btn')?.addEventListener('click', () => this.handleLibraryContinue());
        
        // Add player modal handlers
        document.getElementById('add-player-submit')?.addEventListener('click', () => this.handleAddPlayer());
        document.getElementById('add-player-cancel')?.addEventListener('click', () => this.hideModal('add-player-modal'));
        document.getElementById('close-add-player')?.addEventListener('click', () => this.hideModal('add-player-modal'));
        
        // Edit player modal handlers
        document.getElementById('edit-player-submit')?.addEventListener('click', () => this.handleEditPlayer());
        document.getElementById('edit-player-cancel')?.addEventListener('click', () => {
            this.hideModal('edit-player-modal');
            this.showModal('player-library-modal');
        });
        document.getElementById('close-edit-player')?.addEventListener('click', () => {
            this.hideModal('edit-player-modal');
            this.showModal('player-library-modal');
        });
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').classList.remove('active');
            });
        });
    },
    
    // Handle library continue button
    async handleLibraryContinue() {
        if (this.libraryMode === 'delete' && this.selectedPlayersForDelete.length > 0) {
            const confirmDelete = confirm(`Delete ${this.selectedPlayersForDelete.length} player(s)?`);
            
            if (confirmDelete) {
                const players = PlayerLibraryModule.getAllPlayers();
                const playerIdsToDelete = this.selectedPlayersForDelete
                    .map(playerName => {
                        const player = players.find(p => 
                            `${p.firstName} ${p.lastName}` === playerName
                        );
                        return player?.id;
                    })
                    .filter(id => id !== undefined);
                
                if (playerIdsToDelete.length > 0) {
                    const result = await PlayerLibraryModule.deletePlayers(playerIdsToDelete);
                    
                    if (result.success) {
                        this.selectedPlayersForDelete.forEach(playerName => {
                            const gameIndex = this.selectedPlayersForGame.indexOf(playerName);
                            if (gameIndex > -1) {
                                this.selectedPlayersForGame.splice(gameIndex, 1);
                            }
                        });
                        
                        this.selectedPlayersForDelete = [];
                        this.libraryMode = 'select';
                        this.renderPlayerLibrary();
                        this.renderPlayerSelectionLists();
                        this.updateLibraryButtonStates();
                        alert('Players deleted successfully!');
                    } else {
                        alert('Failed to delete players. Please try again.');
                    }
                }
            }
        } else {
            this.renderPlayerSelectionLists();
            this.hideModal('player-library-modal');
            this.libraryMode = 'select';
            this.selectedPlayersForDelete = [];
        }
    },
    
    // Handle add player
    async handleAddPlayer() {
        const firstName = document.getElementById('new-player-firstname').value.trim();
        const lastName = document.getElementById('new-player-lastname').value.trim();
        const nationality = document.getElementById('new-player-nationality').value;
        
        if (firstName === '' || lastName === '') {
            alert('Please enter both first and last name');
            return;
        }
        
        const result = await PlayerLibraryModule.addPlayer(firstName, lastName, nationality || null);
        
        if (result.success) {
            this.renderPlayerLibrary();
            this.renderPlayerSelectionLists();
            this.hideModal('add-player-modal');
            document.getElementById('new-player-firstname').value = '';
            document.getElementById('new-player-lastname').value = '';
            document.getElementById('new-player-nationality').value = '';
            alert('Player added successfully!');
        } else {
            alert('Failed to add player. Please try again.');
        }
    },
    
    // Handle edit player
    async handleEditPlayer() {
        if (!this.currentEditingPlayer) return;
        
        const firstName = document.getElementById('edit-player-firstname').value.trim();
        const lastName = document.getElementById('edit-player-lastname').value.trim();
        const playerId = document.getElementById('edit-player-id').value.trim();
        const email = document.getElementById('edit-player-email').value.trim().toLowerCase();
        const nationality = document.getElementById('edit-player-nationality').value;
        
        if (firstName === '' || lastName === '') {
            alert('Please enter both first and last name');
            return;
        }
        
        // Verify account link if email is provided
        if (email && window.PlayerAccountSystem) {
            const linkResult = await window.PlayerAccountSystem.linkPlayerToAccount(email, playerId);
            if (!linkResult.success && playerId) {
                const confirmLink = confirm('Email and Player ID do not match any account. Do you want to continue without linking?');
                if (!confirmLink) return;
            } else if (linkResult.success) {
                alert('Player successfully linked to DartStream Stats account!');
            }
        }
        
        const result = await PlayerLibraryModule.updatePlayer(
            this.currentEditingPlayer.id, 
            firstName, 
            lastName, 
            nationality || null,
            playerId
        );
        
        if (result.success) {
            this.renderPlayerLibrary();
            this.renderPlayerSelectionLists();
            this.hideModal('edit-player-modal');
            this.showModal('player-library-modal');
            this.currentEditingPlayer = null;
            alert('Player updated successfully!');
        } else {
            alert('Failed to update player. Please try again.');
        }
    },
    
    // Update player (legacy - kept for compatibility)
    async updatePlayer(playerId, firstName, lastName, nationality = null) {
        const result = await PlayerLibraryModule.updatePlayer(playerId, firstName, lastName, nationality);
        
        if (result.success) {
            this.renderPlayerLibrary();
            this.renderPlayerSelectionLists();
            alert('Player updated successfully!');
        } else {
            alert('Failed to update player. Please try again.');
        }
    },
    
    // Attach player selection handlers
    attachPlayerSelectionHandlers() {
        // Reset picks buttons
        document.getElementById('reset-picks-left')?.addEventListener('click', () => {
            document.getElementById('left-selected-display').textContent = 'Select player from list below';
            this.gameConfig.player1Name = 'Home';
            document.getElementById('player1-name-display').textContent = 'Home';
            document.querySelectorAll('#left-player-list .player-item').forEach(item => {
                item.classList.remove('selected');
            });
        });
        
        document.getElementById('reset-picks-right')?.addEventListener('click', () => {
            document.getElementById('right-selected-display').textContent = 'Select player from list below';
            this.gameConfig.player2Name = 'Away';
            document.getElementById('player2-name-display').textContent = 'Away';
            document.querySelectorAll('#right-player-list .player-item').forEach(item => {
                item.classList.remove('selected');
            });
        });
        
        // Back to game mode button
        document.getElementById('back-to-game-mode')?.addEventListener('click', () => {
            this.showScreen('game-mode-screen');
            this.selectedPlayersForGame = [];
            this.gameConfig.player1Name = 'Home';
            this.gameConfig.player2Name = 'Away';
            document.getElementById('player1-name-display').textContent = 'Home';
            document.getElementById('player2-name-display').textContent = 'Away';
            document.getElementById('left-selected-display').textContent = 'Select player from list below';
            document.getElementById('right-selected-display').textContent = 'Select player from list below';
        });
    },
    
    // Render player selection lists
    renderPlayerSelectionLists() {
        const leftPlayerList = document.getElementById('left-player-list');
        const rightPlayerList = document.getElementById('right-player-list');
        
        console.log('Rendering player selection lists...');
        console.log('Left list element:', leftPlayerList);
        console.log('Right list element:', rightPlayerList);
        
        if (!leftPlayerList || !rightPlayerList) {
            console.error('Player list elements not found!');
            return;
        }
        
        // Determine which players to show
        let playersToShow;
        if (!this.filteringActive) {
            playersToShow = PlayerLibraryModule.getAllPlayers();
        } else {
            playersToShow = PlayerLibraryModule.getAllPlayers().filter(player => {
                const playerName = `${player.firstName} ${player.lastName}`;
                return this.selectedPlayersForGame.includes(playerName);
            });
        }
        
        console.log('Players to show:', playersToShow.length, playersToShow);
        
        // Render left list
        leftPlayerList.innerHTML = '';
        console.log('Rendering left player list with', playersToShow.length, 'players');
        playersToShow.forEach(player => {
            const playerName = `${player.firstName} ${player.lastName}`;
            console.log('Adding player to left list:', playerName);
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            if (this.gameConfig.player2Name === playerName) {
                playerItem.classList.add('disabled');
                playerItem.style.opacity = '0.4';
                playerItem.style.pointerEvents = 'none';
            }
            
            if (this.gameConfig.player1Name === playerName) {
                playerItem.classList.add('selected');
            }
            
            playerItem.innerHTML = `<span>${playerName}</span>`;
            playerItem.addEventListener('click', () => this.selectPlayer(player, 'left'));
            leftPlayerList.appendChild(playerItem);
        });
        
        // Render right list
        rightPlayerList.innerHTML = '';
        playersToShow.forEach(player => {
            const playerName = `${player.firstName} ${player.lastName}`;
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            if (this.gameConfig.player1Name === playerName) {
                playerItem.classList.add('disabled');
                playerItem.style.opacity = '0.4';
                playerItem.style.pointerEvents = 'none';
            }
            
            if (this.gameConfig.player2Name === playerName) {
                playerItem.classList.add('selected');
            }
            
            playerItem.innerHTML = `<span>${playerName}</span>`;
            playerItem.addEventListener('click', () => this.selectPlayer(player, 'right'));
            rightPlayerList.appendChild(playerItem);
        });
    },
    
    // Select a player for left or right side
    selectPlayer(player, side) {
        const playerName = `${player.firstName} ${player.lastName}`;
        
        if (side === 'left') {
            this.gameConfig.player1Name = playerName;
            this.gameConfig.player1Nationality = player.nationality || '';
            document.getElementById('left-selected-display').textContent = playerName;
            document.getElementById('player1-name-display').textContent = playerName;
        } else {
            this.gameConfig.player2Name = playerName;
            this.gameConfig.player2Nationality = player.nationality || '';
            document.getElementById('right-selected-display').textContent = playerName;
            document.getElementById('player2-name-display').textContent = playerName;
        }
        
        this.renderPlayerSelectionLists();
    },
    
    // Attach match settings handlers
    attachMatchSettingsHandlers() {
        // Setting option buttons
        document.querySelectorAll('.setting-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const parent = this.parentElement;
                parent.querySelectorAll('.setting-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
        });
        
        // Continue button
        document.querySelector('#match-settings-modal .continue-btn')?.addEventListener('click', () => {
            this.hideModal('match-settings-modal');
            this.showPlayerSelection();
        });
        
        // Advanced settings button
        document.querySelector('.settings-btn.gold')?.addEventListener('click', () => {
            this.hideModal('match-settings-modal');
            this.showModal('advanced-settings-modal');
        });
        
        // Advanced settings continue
        document.querySelector('#advanced-settings-modal .continue-btn.green')?.addEventListener('click', () => {
            this.hideModal('advanced-settings-modal');
            this.showPlayerSelection();
        });
    },
    
    // Start game - return configuration to main app
    startGame() {
        // Validate players are selected
        if (!this.gameConfig.player1Name || !this.gameConfig.player2Name) {
            alert('Please select both players');
            return null;
        }
        
        // Read settings from UI (if custom game)
        if (this.gameConfig.gameMode === 'custom') {
            this.readCustomSettings();
        }
        
        // Return complete game configuration
        return {
            ...this.gameConfig,
            timestamp: new Date().toISOString()
        };
    },
    
    // Read custom settings from UI
    readCustomSettings() {
        // Read starting score
        const selectedScore = document.querySelector('.starting-score .setting-option.selected');
        if (selectedScore) {
            const score = parseInt(selectedScore.textContent);
            this.gameConfig.startScore = score;
            this.gameConfig.gameType = score.toString();
        }
        
        // Read start type
        const selectedStartType = document.querySelector('.start-type .setting-option.selected');
        if (selectedStartType) {
            this.gameConfig.startType = selectedStartType.textContent.replace(' ', '');
        }
        
        // Read finish type
        const selectedFinishType = document.querySelector('.finish-type .setting-option.selected');
        if (selectedFinishType) {
            this.gameConfig.finishType = selectedFinishType.textContent;
        }
        
        // Additional settings can be read here
    },
    
    // Utility functions
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
    },
    
    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    },
    
    hideModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }
};
