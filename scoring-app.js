// ===== SCORING APP MODULE =====
// Pure scoring logic for X01 games
// Handles number pad input, turn management, bust detection, win validation, averages

const ScoringApp = {
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
                    turnHistory: [],
                    achievements: {
                        count_180s: 0,
                        count_171s: 0,
                        count_95s: 0,
                        count_100_plus: 0,
                        count_120_plus: 0,
                        count_140_plus: 0,
                        count_160_plus: 0
                    }
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
                    turnHistory: [],
                    achievements: {
                        count_180s: 0,
                        count_171s: 0,
                        count_95s: 0,
                        count_100_plus: 0,
                        count_120_plus: 0,
                        count_140_plus: 0,
                        count_160_plus: 0
                    }
                }
            },
            matchSettings: { ...config },
            // Track all legs for detailed match summary
            allLegs: []
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
        
        // Recalculate averages after bust (darts added but no score)
        if (player.legDarts > 0) {
            player.legAvg = (player.legScore / player.legDarts) * 3;
        }
        if (player.matchDarts > 0) {
            player.matchAvg = (player.matchScore / player.matchDarts) * 3;
        }
        
        this.gameState.currentVisit = [];
        this.gameState.dartsThrown = 0;
        this.gameState.turnTotal = 0;
        this.gameState.currentInput = '';
        this.updateDualFunctionButtons();
        this.updateGameScreen();
        
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
        
        // Store checkout data for scoreboard display
        player.lastCheckout = {
            score: checkoutScore,
            darts: finishingDart
        };
        
        // Store complete leg data for match summary
        this.saveLegData(this.gameState.currentPlayer, checkoutScore);
        
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
        
        // Track achievements for this turn
        const turnScore = this.gameState.turnTotal;
        if (turnScore === 180) player.achievements.count_180s++;
        if (turnScore === 171) player.achievements.count_171s++;
        if (turnScore === 95) player.achievements.count_95s++;
        if (turnScore >= 100) player.achievements.count_100_plus++;
        if (turnScore >= 120) player.achievements.count_120_plus++;
        if (turnScore >= 140) player.achievements.count_140_plus++;
        if (turnScore >= 160) player.achievements.count_160_plus++;
        
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
        
        // Notify parent window if in iframe (Play Online mode)
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'score-update',
                player1Score: this.gameState.players.player1.score,
                player2Score: this.gameState.players.player2.score,
                player1Avg: this.gameState.players.player1.legAvg,
                player2Avg: this.gameState.players.player2.legAvg,
                currentPlayer: this.gameState.currentPlayer,
                turnComplete: true
            }, '*');
        }
        
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
    
    // Save leg data for detailed match summary
    saveLegData(winnerPlayerNum, checkoutScore) {
        const p1 = this.gameState.players.player1;
        const p2 = this.gameState.players.player2;
        
        const legData = {
            legNumber: this.gameState.allLegs.length + 1,
            setNumber: this.gameState.currentSet,
            winner: winnerPlayerNum,
            checkoutScore: checkoutScore,
            player1: {
                name: p1.name,
                turns: [...p1.turnHistory],
                legDarts: p1.legDarts,
                legAverage: p1.legAvg,
                legScore: p1.legScore,
                finalScore: p1.score
            },
            player2: {
                name: p2.name,
                turns: [...p2.turnHistory],
                legDarts: p2.legDarts,
                legAverage: p2.legAvg,
                legScore: p2.legScore,
                finalScore: p2.score
            }
        };
        
        this.gameState.allLegs.push(legData);
        console.log('Saved leg data:', legData);
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
        
        console.log(`Check Match Win: ${p1.name} has ${p1.setWins} sets, ${p2.name} has ${p2.setWins} sets. Need ${setsNeeded} to win.`);
        
        if (p1.setWins >= setsNeeded) {
            console.log('🏆 MATCH COMPLETE - Player 1 wins!');
            this.showMatchComplete(p1, p2, 1);
        } else if (p2.setWins >= setsNeeded) {
            console.log('🏆 MATCH COMPLETE - Player 2 wins!');
            this.showMatchComplete(p2, p1, 2);
        } else {
            console.log('📊 Starting new set...');
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
        
        // Check if running in iframe (Play Online mode)
        const isInIframe = window.parent !== window;
        
        if (isInIframe) {
            // Notify parent window of match completion (for Play Online)
            window.parent.postMessage({
                type: 'match-complete',
                winnerNum: winnerNum,
                gameState: this.gameState
            }, '*');
            
            // Auto-save in Play Online mode (parent handles the stats saving)
            setTimeout(() => {
                this.discardMatch();
            }, 3000);
        } else {
            // Normal mode - attach save/discard handlers
            const saveBtn = document.getElementById('save-match-btn');
            const discardBtn = document.getElementById('discard-match-btn');
            
            console.log('Setting up button handlers:', saveBtn, discardBtn);
            
            if (saveBtn) {
                saveBtn.onclick = () => {
                    console.log('Save button clicked!');
                    this.saveMatchStats(winnerNum);
                };
            }
            
            if (discardBtn) {
                discardBtn.onclick = () => {
                    console.log('Discard button clicked!');
                    this.discardMatch();
                };
            }
        }
    },
    
    // Save match stats to database
    async saveMatchStats(winnerNum) {
        try {
            const p1 = this.gameState.players.player1;
            const p2 = this.gameState.players.player2;
            
            // Get player library IDs from PlayerDB
            const players = await window.PlayerDB.getAllPlayers();
            
            console.log('All players from library:', players);
            console.log('Looking for:', p1.name, 'and', p2.name);
            
            // Find players by name match (firstName + lastName)
            const player1Data = players.find(p => `${p.firstName} ${p.lastName}` === p1.name);
            const player2Data = players.find(p => `${p.firstName} ${p.lastName}` === p2.name);
            
            console.log('Found player1Data:', player1Data);
            console.log('Found player2Data:', player2Data);
            
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
                    count_180s: p1.achievements.count_180s,
                    count_171s: p1.achievements.count_171s,
                    count_95s: p1.achievements.count_95s,
                    count_100_plus: p1.achievements.count_100_plus,
                    count_120_plus: p1.achievements.count_120_plus,
                    count_140_plus: p1.achievements.count_140_plus,
                    count_160_plus: p1.achievements.count_160_plus,
                    leg_scores: this.gameState.allLegs,
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
                    count_180s: p2.achievements.count_180s,
                    count_171s: p2.achievements.count_171s,
                    count_95s: p2.achievements.count_95s,
                    count_100_plus: p2.achievements.count_100_plus,
                    count_120_plus: p2.achievements.count_120_plus,
                    count_140_plus: p2.achievements.count_140_plus,
                    count_160_plus: p2.achievements.count_160_plus,
                    leg_scores: this.gameState.allLegs,
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
        
        // Sync game state to Supabase for scoreboard
        if (window.GameStateSync) {
            window.GameStateSync.syncGameState(this.gameState);
        }
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

// Make ScoringApp globally available
window.ScoringApp = ScoringApp;

// ===== IFRAME MODE - Listen for turn control from parent =====
// When embedded in play-online.html, this enables/disables scoring based on whose turn it is
window.addEventListener('message', (event) => {
    const iframe = window.frameElement;
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) return; // Only process messages when in iframe
    
    if (event.data.type === 'initialize-game') {
        // Initialize the game with config from Play Online
        const config = event.data.config;
        console.log('Initializing game from Play Online:', config);
        
        // Hide setup screen, show game screen
        ScoringApp.showScreen('game-screen');
        
        // Initialize the game
        ScoringApp.initialize(config);
        
        // Add room code display if available
        if (config.roomCode) {
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                // Add room code banner at top of game screen
                const roomCodeBanner = document.createElement('div');
                roomCodeBanner.id = 'online-room-code-banner';
                roomCodeBanner.style.cssText = 'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 2px solid #facc15; padding: 10px; text-align: center;';
                roomCodeBanner.innerHTML = `
                    <div style="color: #94a3b8; font-size: 0.7rem;">ONLINE MATCH • ROOM CODE</div>
                    <div style="color: #facc15; font-size: 1.2rem; font-weight: bold; letter-spacing: 0.3rem;">${config.roomCode}</div>
                `;
                gameScreen.insertBefore(roomCodeBanner, gameScreen.firstChild);
            }
        }
    }
    
    if (event.data.type === 'set-turn') {
        const enabled = event.data.enabled;
        console.log('Turn control:', enabled ? 'ENABLED' : 'DISABLED');
        
        // Disable/enable all input buttons
        const buttons = document.querySelectorAll('.num-btn, .action-btn, .score-input-btn');
        buttons.forEach(btn => {
            if (enabled) {
                btn.removeAttribute('disabled');
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            } else {
                btn.setAttribute('disabled', 'true');
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
        
        // Show visual indicator
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            if (enabled) {
                gameScreen.classList.remove('opponent-turn');
                gameScreen.classList.add('your-turn');
            } else {
                gameScreen.classList.remove('your-turn');
                gameScreen.classList.add('opponent-turn');
            }
        }
    }
    
    if (event.data.type === 'show-waiting') {
        // Guest: Show waiting screen with room code
        const roomCode = event.data.roomCode;
        const message = event.data.message;
        
        console.log('Showing waiting screen for guest...');
        
        // Create waiting screen overlay
        const setupScreen = document.getElementById('setup-screen');
        if (setupScreen) {
            setupScreen.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
                    <div style="background: rgba(30, 41, 59, 0.9); border: 2px solid #334155; border-radius: 16px; padding: 40px; max-width: 500px;">
                        <h1 style="color: #facc15; font-size: 2rem; margin-bottom: 20px;">⏳ Waiting for Host</h1>
                        <p style="color: #94a3b8; font-size: 1.2rem; margin-bottom: 20px;">${message}</p>
                        <div style="background: #0f172a; border: 2px solid #facc15; border-radius: 12px; padding: 20px; margin: 20px 0;">
                            <div style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 5px;">Room Code</div>
                            <div style="color: #facc15; font-size: 2.5rem; font-weight: bold; letter-spacing: 0.5rem;">${roomCode}</div>
                        </div>
                        <div style="margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px;">
                            <p style="color: #10b981; margin: 0; font-size: 0.9rem;">✅ Connected - Video call active</p>
                        </div>
                    </div>
                </div>
            `;
            setupScreen.classList.add('active');
        }
    }
    
    if (event.data.type === 'show-online-setup') {
        // Host: Show game setup interface with pre-selected players from Play Online
        const config = event.data.config;
        
        console.log('Showing online setup screen with config:', config);
        
        // Show setup screen with the two connected players ONLY
        const setupScreen = document.getElementById('setup-screen');
        if (setupScreen) {
            setupScreen.innerHTML = `
                <div class="setup-container" style="padding: 20px;">
                    <div style="background: rgba(30, 41, 59, 0.9); border: 2px solid #334155; border-radius: 12px; padding: 30px;">
                        <h1 style="color: #facc15; text-align: center; margin-bottom: 20px;">Online Match Setup</h1>
                        
                        <div style="background: #0f172a; border: 2px solid #facc15; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                            <div style="color: #94a3b8; font-size: 0.8rem;">Room Code</div>
                            <div style="color: #facc15; font-size: 1.5rem; font-weight: bold; letter-spacing: 0.3rem;">${config.roomCode}</div>
                        </div>
                        
                        <!-- Connected Players (Fixed) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div style="background: #0f172a; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; text-align: center;">
                                <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 5px;">HOST</div>
                                <div style="color: #facc15; font-size: 1.2rem; font-weight: bold;">${config.player1Name}</div>
                                <div style="color: #10b981; font-size: 0.75rem; margin-top: 5px;">✓ Connected</div>
                            </div>
                            <div style="background: #0f172a; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; text-align: center;">
                                <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 5px;">GUEST</div>
                                <div style="color: #facc15; font-size: 1.2rem; font-weight: bold;">${config.player2Name}</div>
                                <div style="color: #10b981; font-size: 0.75rem; margin-top: 5px;">✓ Connected</div>
                            </div>
                        </div>
                        
                        <!-- Game Type Selection -->
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-weight: bold;">Game Type</label>
                            <select id="online-game-type-select" class="select-input" style="width: 100%; padding: 10px; background: #0f172a; border: 2px solid #334155; border-radius: 8px; color: white;">
                                <option value="301-sido" ${config.startScore === 301 && !config.doubleOut ? 'selected' : ''}>301 SIDO</option>
                                <option value="301-dido" ${config.startScore === 301 && config.doubleOut ? 'selected' : ''}>301 DIDO</option>
                                <option value="501-sido" ${config.startScore === 501 && !config.doubleOut ? 'selected' : ''}>501 SIDO</option>
                                <option value="501-dido" ${config.startScore === 501 && config.doubleOut ? 'selected' : ''}>501 DIDO</option>
                            </select>
                        </div>
                        
                        <!-- Match Format -->
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-weight: bold;">Match Format</label>
                            <select id="online-format-select" class="select-input" style="width: 100%; padding: 10px; background: #0f172a; border: 2px solid #334155; border-radius: 8px; color: white;">
                                <option value="single-leg" ${config.totalLegs === 1 ? 'selected' : ''}>Single Leg</option>
                                <option value="best-of-3" ${config.totalLegs === 3 ? 'selected' : ''}>Best of 3 Legs</option>
                                <option value="best-of-5" ${config.totalLegs === 5 ? 'selected' : ''}>Best of 5 Legs</option>
                                <option value="best-of-7" ${config.totalLegs === 7 ? 'selected' : ''}>Best of 7 Legs</option>
                            </select>
                        </div>
                        
                        <!-- Starting Player -->
                        <div class="input-group" style="margin-bottom: 20px;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-weight: bold;">Starting Player</label>
                            <select id="online-starting-player-select" class="select-input" style="width: 100%; padding: 10px; background: #0f172a; border: 2px solid #334155; border-radius: 8px; color: white;">
                                <option value="host">${config.player1Name} (Host)</option>
                                <option value="guest">${config.player2Name} (Guest)</option>
                            </select>
                        </div>
                        
                        <button id="online-start-match-btn" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 12px; color: white; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                            Start Match
                        </button>
                    </div>
                </div>
            `;
            
            setupScreen.classList.add('active');
            
            // Add event listener to start button
            document.getElementById('online-start-match-btn').addEventListener('click', () => {
                const gameType = document.getElementById('online-game-type-select').value;
                const matchFormat = document.getElementById('online-format-select').value;
                const startingPlayer = document.getElementById('online-starting-player-select').value;
                
                // Parse settings
                const [score, inOut] = gameType.split('-');
                const startScore = parseInt(score);
                const doubleOut = inOut === 'dido';
                
                let totalLegs = 1;
                let legsFormat = 'first-to';
                if (matchFormat === 'best-of-3') { totalLegs = 3; legsFormat = 'best-of'; }
                else if (matchFormat === 'best-of-5') { totalLegs = 5; legsFormat = 'best-of'; }
                else if (matchFormat === 'best-of-7') { totalLegs = 7; legsFormat = 'best-of'; }
                
                // Send config back to parent with the connected player IDs
                window.parent.postMessage({
                    type: 'game-config-complete',
                    config: {
                        gameType: score,
                        startScore: startScore,
                        doubleOut: doubleOut,
                        player1Name: config.player1Name,
                        player2Name: config.player2Name,
                        player1Id: config.player1Id,
                        player2Id: config.player2Id,
                        totalLegs: totalLegs,
                        legsFormat: legsFormat,
                        firstThrow: startingPlayer === 'host' ? 'player1' : 'player2',
                        roomCode: config.roomCode
                    }
                }, '*');
            });
        }
    }
    
    if (event.data.type === 'update-game-state') {
        // Update local game state from opponent's input
        const remoteState = event.data.gameState;
        console.log('Syncing game state from opponent:', remoteState);
        
        // Update the scoring display without enabling controls
        if (ScoringApp.gameState && remoteState.score !== undefined) {
            // Update scores from opponent
            ScoringApp.gameState.players.player1.score = remoteState.player1Score;
            ScoringApp.gameState.players.player2.score = remoteState.player2Score;
            ScoringApp.updateDisplay();
        }
    }
});

