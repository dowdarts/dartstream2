// ===== SCORING APP MODULE =====
// Pure scoring logic for X01 games
// Handles number pad input, turn management, bust detection, win validation, averages

export const ScoringAppModule = {
    gameState: null,
    
    // Initialize scoring app with game configuration
    initialize(config) {
        this.gameState = {
            currentPlayer: 2, // 1 or 2
            currentVisit: [],
            currentInput: '', // Track digits being entered
            dartsThrown: 0,
            turnTotal: 0,
            visitNumber: 1,
            currentSet: 1,
            currentLeg: 1,
            players: {
                player1: {
                    name: config.player1Name || 'Home',
                    score: config.startScore,
                    preTurnScore: config.startScore,
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
                },
                player2: {
                    name: config.player2Name || 'Away',
                    score: config.startScore,
                    preTurnScore: config.startScore,
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
            matchSettings: { ...config }
        };
        
        this.attachEventHandlers();
        this.updateGameScreen();
    },
    
    // Attach event handlers for number pad and controls
    attachEventHandlers() {
        // Number Pad Scoring
        const numButtons = document.querySelectorAll('.num-btn[data-score]');
        console.log('Found', numButtons.length, 'number buttons');
        
        numButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumberButtonClick(e));
        });
        
        // Action button (UNDO)
        document.getElementById('action-btn')?.addEventListener('click', () => this.handleUndo());
        
        // Submit button (MISS)
        document.getElementById('submit-btn')?.addEventListener('click', () => this.submitCurrentInput());
        
        // Keyboard hotkeys
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Menu button with confirmation
        document.getElementById('menu-btn')?.addEventListener('click', () => this.handleMenuButton());
    },
    
    // Handle number button clicks
    handleNumberButtonClick(e) {
        const btn = e.currentTarget;
        console.log('Button clicked:', btn.textContent, 'data-score:', btn.getAttribute('data-score'));
        
        if (btn.classList.contains('dual-function')) {
            console.log('Dual-function button');
            
            // Check if this is the BUST button
            if (btn.getAttribute('data-function') === 'bust') {
                this.handleBust();
                return;
            }
            
            // Handle dual-function buttons
            const hasInput = this.gameState.currentVisit.length > 0;
            
            if (hasInput) {
                console.log('Operation mode');
                const operation = btn.getAttribute('data-operation');
                const lastScore = this.gameState.currentVisit[this.gameState.currentVisit.length - 1].score;
                
                if (operation === 'multiply') {
                    this.addScore(lastScore * 3, false);
                } else if (operation === 'zero') {
                    this.addScore(0, false);
                } else if (operation === 'plus') {
                    this.addScore(lastScore * 2, true);
                }
            } else {
                console.log('Quick score mode');
                const score = parseInt(btn.getAttribute('data-score'));
                this.addScore(score, false);
            }
        } else {
            console.log('Regular number button - adding digit');
            const digit = btn.getAttribute('data-score');
            this.addDigit(digit);
        }
    },
    
    // Handle keyboard input
    handleKeydown(e) {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen.classList.contains('active')) {
            return;
        }
        
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            this.addDigit(e.key);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.submitCurrentInput();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.handleUndo();
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            if (this.gameState.currentVisit.length > 0) {
                const lastScore = this.gameState.currentVisit[this.gameState.currentVisit.length - 1].score;
                this.addScore(lastScore * 2, true);
            }
        } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
            e.preventDefault();
            if (this.gameState.currentVisit.length > 0) {
                const lastScore = this.gameState.currentVisit[this.gameState.currentVisit.length - 1].score;
                this.addScore(lastScore * 3, false);
            }
        }
    },
    
    // Add digit to current input
    addDigit(digit) {
        if (this.gameState.currentVisit.length >= 3) {
            return;
        }
        
        if (this.gameState.currentInput.length < 3) {
            this.gameState.currentInput += digit;
            console.log('Current input:', this.gameState.currentInput);
            this.updateGameScreen();
        }
    },
    
    // Submit current input as a score
    submitCurrentInput() {
        if (this.gameState.currentInput) {
            const score = parseInt(this.gameState.currentInput);
            if (score <= 180) {
                const currentPlayerKey = `player${this.gameState.currentPlayer}`;
                const player = this.gameState.players[currentPlayerKey];
                const provisionalScore = player.preTurnScore - this.gameState.turnTotal - score;
                
                let isDouble = false;
                if (provisionalScore === 0 && score <= 50 && score % 2 === 0) {
                    isDouble = confirm(`Was this a DOUBLE ${score / 2}? (D${score / 2})`);
                }
                
                this.addScore(score, isDouble);
            }
        } else {
            // No input = miss (0)
            this.addScore(0, false);
        }
    },
    
    // Handle undo button
    handleUndo() {
        if (this.gameState.currentInput) {
            this.gameState.currentInput = this.gameState.currentInput.slice(0, -1);
            this.updateGameScreen();
        } else if (this.gameState.currentVisit.length > 0) {
            this.gameState.currentVisit.pop();
            this.updateDualFunctionButtons();
            this.updateGameScreen();
        }
    },
    
    // Handle menu button
    handleMenuButton() {
        const confirmExit = confirm('Exit to main menu? Current game will be lost.');
        if (confirmExit) {
            // Return to game mode screen
            this.showScreen('game-mode-screen');
        }
    },
    
    // Add score (core scoring logic)
    addScore(score, isDouble = false) {
        if (this.gameState.currentVisit.length >= 3) {
            return;
        }
        
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        
        // Add dart to current visit
        this.gameState.currentVisit.push({ score, isDouble });
        this.gameState.currentInput = '';
        this.gameState.dartsThrown = this.gameState.currentVisit.length;
        
        // Calculate turn total
        this.gameState.turnTotal = this.gameState.currentVisit.reduce((sum, dart) => sum + dart.score, 0);
        
        // Calculate provisional score
        const provisionalScore = player.preTurnScore - this.gameState.turnTotal;
        
        this.updateDualFunctionButtons();
        
        // Check for immediate bust
        if (provisionalScore === 1 || provisionalScore < 0) {
            this.handleBust();
            return;
        }
        
        // Check for win
        if (provisionalScore === 0) {
            if (isDouble || score === 50) {
                this.handleWin();
                return;
            } else {
                this.handleBust();
                return;
            }
        }
        
        // Valid dart, continue turn
        if (this.gameState.currentVisit.length === 3) {
            setTimeout(() => this.completeTurn(), 500);
        } else {
            this.updateGameScreen();
        }
    },
    
    // Handle bust
    handleBust() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        
        alert(`BUST! Score reverts to ${player.preTurnScore}`);
        
        player.legDarts += this.gameState.currentVisit.length;
        player.matchDarts += this.gameState.currentVisit.length;
        player.score = player.preTurnScore;
        
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        this.gameState.currentInput = '';
        this.updateDualFunctionButtons();
        
        this.switchPlayer();
    },
    
    // Handle win
    handleWin() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        
        const dartFinished = prompt('Which dart finished the game? (1, 2, or 3)', this.gameState.currentVisit.length);
        const finishingDart = parseInt(dartFinished) || this.gameState.currentVisit.length;
        
        player.legDarts += finishingDart;
        player.matchDarts += finishingDart;
        player.legScore = this.gameState.matchSettings.startScore;
        player.matchScore += player.legScore;
        player.score = 0;
        
        if (player.legDarts > 0) {
            player.legAvg = (player.legScore / player.legDarts) * 3;
        }
        if (player.matchDarts > 0) {
            player.matchAvg = (player.matchScore / player.matchDarts) * 3;
        }
        
        const checkoutScore = this.gameState.turnTotal;
        alert(`GAME SHOT! ${player.name} wins with a ${checkoutScore} checkout!`);
        
        player.legWins++;
        
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        this.gameState.currentInput = '';
        this.updateDualFunctionButtons();
        
        this.updateGameScreen();
        
        setTimeout(() => this.checkSetWin(), 1000);
    },
    
    // Complete turn
    completeTurn() {
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        
        player.score = player.preTurnScore - this.gameState.turnTotal;
        player.legDarts += this.gameState.currentVisit.length;
        player.matchDarts += this.gameState.currentVisit.length;
        player.legScore += this.gameState.turnTotal;
        player.matchScore += this.gameState.turnTotal;
        
        if (player.legDarts > 0) {
            player.legAvg = (player.legScore / player.legDarts) * 3;
        }
        if (player.matchDarts > 0) {
            player.matchAvg = (player.matchScore / player.matchDarts) * 3;
        }
        
        player.turnHistory.push({
            darts: [...this.gameState.currentVisit],
            total: this.gameState.turnTotal,
            scoreAfter: player.score
        });
        
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        this.gameState.currentInput = '';
        this.updateDualFunctionButtons();
        
        this.switchPlayer();
    },
    
    // Switch player
    switchPlayer() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        
        const newPlayerKey = `player${this.gameState.currentPlayer}`;
        this.gameState.players[newPlayerKey].preTurnScore = this.gameState.players[newPlayerKey].score;
        
        if (this.gameState.currentPlayer === 1) {
            this.gameState.visitNumber++;
        }
        
        this.updateGameScreen();
    },
    
    // Check set win
    checkSetWin() {
        const p1 = this.gameState.players.player1;
        const p2 = this.gameState.players.player2;
        
        const legsNeeded = this.gameState.matchSettings.legsFormat === 'best-of'
            ? this.gameState.matchSettings.legsToWin
            : this.gameState.matchSettings.totalLegs;
        
        if (p1.legWins >= legsNeeded) {
            p1.setWins++;
            alert(`${p1.name} wins the set ${p1.legWins}-${p2.legWins}!`);
            this.checkMatchWin();
        } else if (p2.legWins >= legsNeeded) {
            p2.setWins++;
            alert(`${p2.name} wins the set ${p2.legWins}-${p1.legWins}!`);
            this.checkMatchWin();
        } else {
            this.startNewLeg();
        }
    },
    
    // Check match win
    checkMatchWin() {
        const p1 = this.gameState.players.player1;
        const p2 = this.gameState.players.player2;
        
        const setsNeeded = this.gameState.matchSettings.setsFormat === 'best-of'
            ? this.gameState.matchSettings.setsToWin
            : this.gameState.matchSettings.totalSets;
        
        if (p1.setWins >= setsNeeded) {
            this.showMatchComplete(p1, p2, 1);
        } else if (p2.setWins >= setsNeeded) {
            this.showMatchComplete(p2, p1, 2);
        } else {
            this.startNewSet();
        }
    },
    
    // Show match complete modal
    showMatchComplete(winner, loser, winnerNum) {
        const modal = document.getElementById('match-complete-modal');
        document.getElementById('match-winner-name').textContent = winner.name;
        document.getElementById('match-complete-text').textContent = 
            `${winner.name} wins ${winner.setWins}-${loser.setWins}!`;
        
        // Display final stats
        document.getElementById('player1-final-stats').innerHTML = `
            <strong>${this.gameState.players.player1.name}</strong><br>
            Sets: ${this.gameState.players.player1.setWins}<br>
            Match Avg: ${this.gameState.players.player1.matchAvg.toFixed(2)}
        `;
        document.getElementById('player2-final-stats').innerHTML = `
            <strong>${this.gameState.players.player2.name}</strong><br>
            Sets: ${this.gameState.players.player2.setWins}<br>
            Match Avg: ${this.gameState.players.player2.matchAvg.toFixed(2)}
        `;
        
        modal.style.display = 'flex';
        
        // Attach save/discard handlers
        document.getElementById('save-match-btn').onclick = () => this.saveMatchStats(winnerNum);
        document.getElementById('discard-match-btn').onclick = () => this.discardMatch();
    },
    
    // Save match stats to database
    async saveMatchStats(winnerNum) {
        try {
            const p1 = this.gameState.players.player1;
            const p2 = this.gameState.players.player2;
            
            // Get player library IDs from PlayerDB
            const players = await window.PlayerDB.getPlayers();
            
            // Find players by name match
            const player1Data = players.find(p => p.name === p1.name);
            const player2Data = players.find(p => p.name === p2.name);
            
            if (!player1Data || !player2Data) {
                console.log('Players not found in library, stats not saved');
                alert('Match completed! (Stats not saved - players not found in library)');
                this.discardMatch();
                return;
            }
            
            // Check if players have linked accounts
            if (!player1Data.account_linked_player_id && !player2Data.account_linked_player_id) {
                console.log('No linked accounts found');
                alert('Match completed! (No player accounts linked for stats tracking)');
                this.discardMatch();
                return;
            }
            
            const matchId = `match_${Date.now()}`;
            const matchDate = new Date().toISOString();
            
            // Prepare match data for both players
            const savePromises = [];
            
            if (player1Data.account_linked_player_id) {
                const p1MatchData = {
                    match_id: matchId,
                    player_library_id: player1Data.id,
                    opponent_name: p2.name,
                    match_date: matchDate,
                    won: winnerNum === 1,
                    legs_won: p1.legWins,
                    legs_lost: p2.legWins,
                    sets_won: p1.setWins,
                    sets_lost: p2.setWins,
                    total_darts_thrown: p1.matchDarts,
                    total_score: p1.matchScore,
                    average_3dart: p1.matchAvg,
                    first_9_average: 0, // Can be calculated if needed
                    highest_checkout: 0, // Would need to track during game
                    checkout_percentage: 0, // Would need to track during game
                    leg_scores: [], // Could store individual leg data
                    checkout_history: []
                };
                savePromises.push(window.PlayerDB.recordMatchStats(p1MatchData));
            }
            
            if (player2Data.account_linked_player_id) {
                const p2MatchData = {
                    match_id: matchId,
                    player_library_id: player2Data.id,
                    opponent_name: p1.name,
                    match_date: matchDate,
                    won: winnerNum === 2,
                    legs_won: p2.legWins,
                    legs_lost: p1.legWins,
                    sets_won: p2.setWins,
                    sets_lost: p1.setWins,
                    total_darts_thrown: p2.matchDarts,
                    total_score: p2.matchScore,
                    average_3dart: p2.matchAvg,
                    first_9_average: 0,
                    highest_checkout: 0,
                    checkout_percentage: 0,
                    leg_scores: [],
                    checkout_history: []
                };
                savePromises.push(window.PlayerDB.recordMatchStats(p2MatchData));
            }
            
            await Promise.all(savePromises);
            
            alert('Match stats saved successfully!');
            this.discardMatch();
            
        } catch (error) {
            console.error('Error saving match stats:', error);
            alert('Error saving match stats. Returning to menu.');
            this.discardMatch();
        }
    },
    
    // Discard match and return to menu
    discardMatch() {
        document.getElementById('match-complete-modal').style.display = 'none';
        this.showScreen('game-mode-screen');
    },
    
    // Start new leg
    startNewLeg() {
        this.gameState.currentLeg++;
        
        const startScore = this.gameState.matchSettings.startScore;
        
        this.gameState.players.player1.score = startScore;
        this.gameState.players.player1.preTurnScore = startScore;
        this.gameState.players.player1.legDarts = 0;
        this.gameState.players.player1.legScore = 0;
        this.gameState.players.player1.legAvg = 0;
        this.gameState.players.player1.turnHistory = [];
        
        this.gameState.players.player2.score = startScore;
        this.gameState.players.player2.preTurnScore = startScore;
        this.gameState.players.player2.legDarts = 0;
        this.gameState.players.player2.legScore = 0;
        this.gameState.players.player2.legAvg = 0;
        this.gameState.players.player2.turnHistory = [];
        
        this.gameState.visitNumber = 1;
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        
        this.updateGameScreen();
    },
    
    // Start new set
    startNewSet() {
        this.gameState.currentSet++;
        
        this.gameState.players.player1.legWins = 0;
        this.gameState.players.player2.legWins = 0;
        
        this.startNewLeg();
    },
    
    // Update dual-function buttons
    updateDualFunctionButtons() {
        const hasInput = this.gameState.currentVisit.length > 0;
        const currentPlayerKey = `player${this.gameState.currentPlayer}`;
        const player = this.gameState.players[currentPlayerKey];
        const dualButtons = document.querySelectorAll('.dual-function');
        
        dualButtons.forEach(btn => {
            if (btn.id === 'btn-180-zero' && !hasInput && player.preTurnScore <= 170) {
                btn.textContent = 'BUST';
                btn.classList.remove('red', 'operation-mode');
                btn.classList.add('green');
                btn.setAttribute('data-function', 'bust');
            } else if (hasInput) {
                btn.textContent = btn.getAttribute('data-alt');
                btn.classList.remove('green', 'red');
                btn.classList.add('operation-mode');
                btn.removeAttribute('data-function');
            } else {
                btn.textContent = btn.getAttribute('data-default');
                btn.classList.remove('operation-mode');
                btn.removeAttribute('data-function');
                if (btn.id === 'btn-100-multiply' || btn.id === 'btn-140-plus') {
                    btn.classList.add('green');
                } else if (btn.id === 'btn-180-zero') {
                    btn.classList.add('red');
                }
            }
        });
    },
    
    // Update game screen
    updateGameScreen() {
        const player1Display = document.getElementById('player1-display');
        const player2Display = document.getElementById('player2-display');
        
        if (!player1Display || !player2Display) return;
        
        // Update names
        player1Display.querySelector('.player-name-large').textContent = this.gameState.players.player1.name;
        player2Display.querySelector('.player-name-large').textContent = this.gameState.players.player2.name;
        
        // Update scores
        player1Display.querySelector('.score-large').textContent = this.gameState.players.player1.score;
        player2Display.querySelector('.score-large').textContent = this.gameState.players.player2.score;
        
        // Update active player
        if (this.gameState.currentPlayer === 1) {
            player1Display.classList.add('active');
            player2Display.classList.remove('active');
        } else {
            player2Display.classList.add('active');
            player1Display.classList.remove('active');
        }
        
        // Update set number
        const setNumberElement = document.getElementById('set-number');
        if (setNumberElement) {
            setNumberElement.textContent = this.gameState.currentSet || 1;
        }
        
        // Update visit number
        const visitElement = document.querySelector('.visit-number');
        if (visitElement) {
            visitElement.textContent = this.gameState.visitNumber;
        }
        
        // Update timer (darts in visit)
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.gameState.currentVisit.length;
        }
        
        // Update input display
        const inputModeDisplay = document.getElementById('input-mode');
        if (inputModeDisplay) {
            if (this.gameState.currentInput) {
                inputModeDisplay.textContent = this.gameState.currentInput;
            } else if (this.gameState.turnTotal > 0) {
                inputModeDisplay.textContent = `Turn: ${this.gameState.turnTotal}`;
            } else {
                inputModeDisplay.textContent = 'Straight-In';
            }
        }
        
        // Update checkout hints
        const p1Score = this.gameState.players.player1.score;
        const p2Score = this.gameState.players.player2.score;
        
        const p1CheckoutElement = document.getElementById('player1-checkout');
        const p2CheckoutElement = document.getElementById('player2-checkout');
        
        if (p1CheckoutElement) {
            p1CheckoutElement.textContent = p1Score <= 170 ? 'HC' : 'HC';
        }
        if (p2CheckoutElement) {
            p2CheckoutElement.textContent = p2Score <= 170 ? 'HC' : 'HC';
        }
        
        // Update set/leg score displays
        this.updateSetLegScores();
    },
    
    // Update set and leg score displays
    updateSetLegScores() {
        const setScoreElement = document.querySelector('.set-score span');
        const legScoreElement = document.querySelector('.leg-score span');
        
        if (setScoreElement) {
            const p1Sets = this.gameState.players.player1.setWins;
            const p2Sets = this.gameState.players.player2.setWins;
            setScoreElement.textContent = `${p1Sets}-${p2Sets}`;
        }
        
        if (legScoreElement) {
            const p1Legs = this.gameState.players.player1.legWins;
            const p2Legs = this.gameState.players.player2.legWins;
            legScoreElement.textContent = `${p1Legs}-${p2Legs}`;
        }
    },
    
    // Utility functions
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
    }
};
